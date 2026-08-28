import type { PredefinedServer } from "@lib/types/connection";

type JsonObject = Record<string, unknown>;

const SUPPORTED_ENTRY_POINT_PROTOCOLS = new Set(["http:", "https:", "mock:"]);

interface FetchedJson {
  value: unknown;
  responseUrl: string;
}

export type OrdDiscoveryPhase = "configuration" | "document" | "resource";

export interface OrdDiscoveryIssue {
  phase: OrdDiscoveryPhase;
  sourceUrl: string;
  message: string;
  path?: string;
  resourceId?: string;
  resourceIndex?: number;
}

export interface OrdDiscoveryResult {
  servers: PredefinedServer[];
  issues: OrdDiscoveryIssue[];
}

/**
 * Checks whether a URL looks like an ORD endpoint.
 */
export function isOrdUrl(url: unknown): boolean {
  return (
    typeof url === "string" &&
    url.includes(".well-known/open-resource-discovery")
  );
}

export function formatOrdDiscoveryIssue(issue: OrdDiscoveryIssue): string {
  const source =
    issue.phase === "configuration"
      ? `ORD configuration ${issue.sourceUrl}`
      : `ORD document ${issue.sourceUrl}`;
  const resource =
    issue.resourceId !== undefined
      ? `resource "${issue.resourceId}"`
      : issue.resourceIndex !== undefined
        ? `resource at apiResources[${issue.resourceIndex}]`
        : undefined;
  const context = [source, resource, issue.path].filter(Boolean).join(", ");
  return `${context}: ${issue.message}`;
}

/**
 * Discovers MCP servers from an Open Resource Discovery endpoint.
 *
 * Each external response is validated at runtime. Independent documents and
 * resources continue processing after an error so callers can use valid servers
 * while presenting all discovery issues.
 *
 * @param idPrefix - Optional prefix for generated IDs (e.g. "custom-" for user-added servers)
 */
export async function discoverServersFromOrd(
  ordUrl: unknown,
  idPrefix = "",
): Promise<OrdDiscoveryResult> {
  const result: OrdDiscoveryResult = { servers: [], issues: [] };
  if (ordUrl === "" || ordUrl === undefined || ordUrl === null) return result;
  if (typeof ordUrl !== "string") {
    result.issues.push({
      phase: "configuration",
      sourceUrl: "Configured ORD URL",
      path: "url",
      message: `Expected a string; received ${valueType(ordUrl)}.`,
    });
    return result;
  }

  const normalizedOrdUrl = ordUrl.trim();
  if (!normalizedOrdUrl) return result;

  const configCandidate = isOrdUrl(normalizedOrdUrl)
    ? normalizedOrdUrl
    : `${normalizedOrdUrl.replace(/\/$/, "")}/.well-known/open-resource-discovery`;
  const configRequestUrl = resolveInitialUrl(configCandidate);
  if (!configRequestUrl) {
    result.issues.push({
      phase: "configuration",
      sourceUrl: configCandidate,
      path: "url",
      message: "Expected a valid absolute or page-relative URL.",
    });
    return result;
  }

  const configResponse = await fetchJson(
    configRequestUrl,
    "configuration",
    result.issues,
  );
  if (!configResponse) return result;
  const configUrl = configResponse.responseUrl;
  const configValue = configResponse.value;
  if (!isJsonObject(configValue)) {
    result.issues.push({
      phase: "configuration",
      sourceUrl: configUrl,
      path: "$",
      message: `Expected a JSON object; received ${valueType(configValue)}.`,
    });
    return result;
  }

  const fallbackBaseUrl = getConfigurationBaseUrl(configUrl);
  const configurationBaseUrl = readBaseUrl(
    configValue.baseUrl,
    fallbackBaseUrl,
    "configuration",
    configUrl,
    "baseUrl",
    result.issues,
  );

  const version = configValue.openResourceDiscoveryV1;
  if (!isJsonObject(version)) {
    result.issues.push({
      phase: "configuration",
      sourceUrl: configUrl,
      path: "openResourceDiscoveryV1",
      message: `Expected a JSON object; received ${valueType(version)}.`,
    });
    return result;
  }

  const documentsValue = version.documents;
  if (documentsValue !== undefined && !Array.isArray(documentsValue)) {
    result.issues.push({
      phase: "configuration",
      sourceUrl: configUrl,
      path: "openResourceDiscoveryV1.documents",
      message: `Expected an array; received ${valueType(documentsValue)}.`,
    });
    return result;
  }

  const documents = documentsValue ?? [];
  for (
    let documentIndex = 0;
    documentIndex < documents.length;
    documentIndex++
  ) {
    const descriptor = documents[documentIndex];
    const descriptorPath = `openResourceDiscoveryV1.documents[${documentIndex}]`;
    if (!isJsonObject(descriptor)) {
      result.issues.push({
        phase: "configuration",
        sourceUrl: configUrl,
        path: descriptorPath,
        message: `Expected a JSON object; received ${valueType(descriptor)}.`,
      });
      continue;
    }

    if (typeof descriptor.url !== "string" || descriptor.url.trim() === "") {
      result.issues.push({
        phase: "configuration",
        sourceUrl: configUrl,
        path: `${descriptorPath}.url`,
        message: `Expected a non-empty string URL; received ${valueType(descriptor.url)}.`,
      });
      continue;
    }

    const documentRequestUrl = resolveBaseUrlReference(
      descriptor.url,
      configurationBaseUrl,
    );
    if (!documentRequestUrl) {
      result.issues.push({
        phase: "configuration",
        sourceUrl: configUrl,
        path: `${descriptorPath}.url`,
        message: `Could not resolve URL reference "${descriptor.url}".`,
      });
      continue;
    }

    const documentResponse = await fetchJson(
      documentRequestUrl,
      "document",
      result.issues,
    );
    if (!documentResponse) continue;
    const documentUrl = documentResponse.responseUrl;
    const documentValue = documentResponse.value;
    if (!isJsonObject(documentValue)) {
      result.issues.push({
        phase: "document",
        sourceUrl: documentUrl,
        path: "$",
        message: `Expected a JSON object; received ${valueType(documentValue)}.`,
      });
      continue;
    }

    const describedSystemBaseUrl = getDescribedSystemBaseUrl(
      documentValue,
      documentUrl,
      result.issues,
    );
    const resourcesValue = documentValue.apiResources;
    if (resourcesValue === undefined) continue;
    if (!Array.isArray(resourcesValue)) {
      result.issues.push({
        phase: "document",
        sourceUrl: documentUrl,
        path: "apiResources",
        message: `Expected an array; received ${valueType(resourcesValue)}.`,
      });
      continue;
    }

    for (
      let resourceIndex = 0;
      resourceIndex < resourcesValue.length;
      resourceIndex++
    ) {
      parseMcpResource(
        resourcesValue[resourceIndex],
        resourceIndex,
        documentUrl,
        describedSystemBaseUrl,
        idPrefix,
        result,
      );
    }
  }

  if (result.servers.length === 0 && result.issues.length === 0) {
    result.issues.push({
      phase: "configuration",
      sourceUrl: configUrl,
      message:
        "No MCP API resources with a usable entry point were found in the referenced ORD documents.",
    });
  }

  return result;
}

function parseMcpResource(
  value: unknown,
  resourceIndex: number,
  documentUrl: string,
  describedSystemBaseUrl: string | undefined,
  idPrefix: string,
  result: OrdDiscoveryResult,
): void {
  if (!isJsonObject(value)) {
    result.issues.push({
      phase: "resource",
      sourceUrl: documentUrl,
      resourceIndex,
      path: `apiResources[${resourceIndex}]`,
      message: `Expected a JSON object; received ${valueType(value)}.`,
    });
    return;
  }

  if (typeof value.apiProtocol !== "string") {
    result.issues.push({
      phase: "resource",
      sourceUrl: documentUrl,
      resourceIndex,
      path: `apiResources[${resourceIndex}].apiProtocol`,
      message: `Expected a string; received ${valueType(value.apiProtocol)}.`,
    });
    return;
  }
  if (value.apiProtocol !== "mcp") return;

  const resourceId =
    typeof value.ordId === "string" && value.ordId.trim() !== ""
      ? value.ordId
      : undefined;
  if (!resourceId) {
    result.issues.push({
      phase: "resource",
      sourceUrl: documentUrl,
      resourceIndex,
      path: `apiResources[${resourceIndex}].ordId`,
      message: `Expected a non-empty string; received ${valueType(value.ordId)}.`,
    });
    return;
  }

  const entryPointsPath = `apiResources[${resourceIndex}].entryPoints`;
  if (!Array.isArray(value.entryPoints) || value.entryPoints.length === 0) {
    result.issues.push({
      phase: "resource",
      sourceUrl: documentUrl,
      resourceId,
      resourceIndex,
      path: entryPointsPath,
      message: `Expected a non-empty array of string URLs; received ${valueType(value.entryPoints)}.`,
    });
    return;
  }

  let serverUrl: string | undefined;
  for (
    let entryPointIndex = 0;
    entryPointIndex < value.entryPoints.length;
    entryPointIndex++
  ) {
    const entryPoint = value.entryPoints[entryPointIndex];
    const path = `${entryPointsPath}[${entryPointIndex}]`;
    if (typeof entryPoint !== "string" || entryPoint.trim() === "") {
      result.issues.push({
        phase: "resource",
        sourceUrl: documentUrl,
        resourceId,
        resourceIndex,
        path,
        message: `Expected a non-empty string URL; received ${valueType(entryPoint)}.`,
      });
      continue;
    }

    if (
      entryPoint.startsWith("/") &&
      !entryPoint.startsWith("//") &&
      !describedSystemBaseUrl
    ) {
      result.issues.push({
        phase: "resource",
        sourceUrl: documentUrl,
        resourceId,
        resourceIndex,
        path,
        message: `Cannot resolve base-URL-relative entry point "${entryPoint}" because describedSystemInstance.baseUrl is missing or invalid.`,
      });
      continue;
    }

    const resolvedUrl = resolveEntryPoint(
      entryPoint,
      describedSystemBaseUrl,
      documentUrl,
    );
    if (!resolvedUrl) {
      result.issues.push({
        phase: "resource",
        sourceUrl: documentUrl,
        resourceId,
        resourceIndex,
        path,
        message: `Could not resolve URL reference "${entryPoint}".`,
      });
      continue;
    }
    const protocol = new URL(resolvedUrl).protocol;
    if (!SUPPORTED_ENTRY_POINT_PROTOCOLS.has(protocol)) {
      result.issues.push({
        phase: "resource",
        sourceUrl: documentUrl,
        resourceId,
        resourceIndex,
        path,
        message: `Unsupported URL scheme "${protocol}". Expected "http:", "https:", or the playground's internal "mock:" scheme.`,
      });
      continue;
    }
    serverUrl ??= resolvedUrl;
  }
  if (!serverUrl) return;

  const title = readOptionalString(
    value,
    "title",
    documentUrl,
    resourceId,
    resourceIndex,
    result.issues,
  );
  const shortDescription = readOptionalString(
    value,
    "shortDescription",
    documentUrl,
    resourceId,
    resourceIndex,
    result.issues,
  );
  const description = readOptionalString(
    value,
    "description",
    documentUrl,
    resourceId,
    resourceIndex,
    result.issues,
  );

  const id = `${idPrefix}${resourceId}`;
  if (result.servers.some((server) => server.id === id)) {
    result.issues.push({
      phase: "resource",
      sourceUrl: documentUrl,
      resourceId,
      resourceIndex,
      path: `apiResources[${resourceIndex}].ordId`,
      message: `Duplicate discovered server ID "${id}". The later resource was skipped.`,
    });
    return;
  }

  result.servers.push({
    id,
    name: resourceId.split(":").slice(-2).join(":"),
    title,
    description: shortDescription || description || "",
    url: serverUrl,
    transportType: "streamable-http",
    tags: ["ORD"],
  });
}

async function fetchJson(
  url: string,
  phase: Exclude<OrdDiscoveryPhase, "resource">,
  issues: OrdDiscoveryIssue[],
): Promise<FetchedJson | undefined> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    issues.push({
      phase,
      sourceUrl: url,
      message: `Network request failed (this can include a CORS failure): ${errorMessage(error)}.`,
    });
    return undefined;
  }

  const responseUrl = response.url || url;
  if (!response.ok) {
    const status = `${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;
    issues.push({
      phase,
      sourceUrl: responseUrl,
      message: `Request failed with HTTP ${status}.`,
    });
    return undefined;
  }

  try {
    return {
      value: await response.json(),
      responseUrl,
    };
  } catch (error) {
    issues.push({
      phase,
      sourceUrl: responseUrl,
      message: `Response is not valid JSON: ${errorMessage(error)}.`,
    });
    return undefined;
  }
}

function readOptionalString(
  object: JsonObject,
  key: string,
  documentUrl: string,
  resourceId: string,
  resourceIndex: number,
  issues: OrdDiscoveryIssue[],
): string | undefined {
  const value = object[key];
  if (value === undefined) return undefined;
  if (typeof value === "string") return value;
  issues.push({
    phase: "resource",
    sourceUrl: documentUrl,
    resourceId,
    resourceIndex,
    path: `apiResources[${resourceIndex}].${key}`,
    message: `Expected a string; received ${valueType(value)}. The field was ignored.`,
  });
  return undefined;
}

function readBaseUrl(
  value: unknown,
  fallback: string,
  phase: Exclude<OrdDiscoveryPhase, "resource">,
  sourceUrl: string,
  path: string,
  issues: OrdDiscoveryIssue[],
): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || value.trim() === "") {
    issues.push({
      phase,
      sourceUrl,
      path,
      message: `Expected a non-empty string URL; received ${valueType(value)}. The fallback base URL will be used.`,
    });
    return fallback;
  }
  const resolved = parseAbsoluteBaseUrl(value);
  if (resolved) return resolved.replace(/\/$/, "");
  issues.push({
    phase,
    sourceUrl,
    path,
    message: `Expected an absolute HTTP(S) URL without a query or fragment; received "${value}". The fallback base URL will be used.`,
  });
  return fallback;
}

function getDescribedSystemBaseUrl(
  document: JsonObject,
  documentUrl: string,
  issues: OrdDiscoveryIssue[],
): string | undefined {
  const describedSystemInstance = document.describedSystemInstance;
  if (describedSystemInstance === undefined) return undefined;
  if (!isJsonObject(describedSystemInstance)) {
    issues.push({
      phase: "document",
      sourceUrl: documentUrl,
      path: "describedSystemInstance",
      message: `Expected a JSON object; received ${valueType(describedSystemInstance)}. Base-URL-relative entry points cannot be resolved.`,
    });
    return undefined;
  }
  const baseUrl = describedSystemInstance.baseUrl;
  if (baseUrl === undefined) return undefined;
  if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
    issues.push({
      phase: "document",
      sourceUrl: documentUrl,
      path: "describedSystemInstance.baseUrl",
      message: `Expected a non-empty absolute URL string; received ${valueType(baseUrl)}. Base-URL-relative entry points cannot be resolved.`,
    });
    return undefined;
  }
  const resolved = parseAbsoluteBaseUrl(baseUrl);
  if (resolved) return resolved.replace(/\/$/, "");
  issues.push({
    phase: "document",
    sourceUrl: documentUrl,
    path: "describedSystemInstance.baseUrl",
    message: `Expected an absolute HTTP(S) URL without a query or fragment; received "${baseUrl}". Base-URL-relative entry points cannot be resolved.`,
  });
  return undefined;
}

function resolveEntryPoint(
  reference: string,
  describedSystemBaseUrl: string | undefined,
  documentUrl: string,
): string | undefined {
  try {
    return new URL(reference).href;
  } catch {
    // Continue with ORD relative-reference rules.
  }

  try {
    if (reference.startsWith("//")) {
      return new URL(reference, documentUrl).href;
    }
    if (reference.startsWith("/")) {
      if (!describedSystemBaseUrl) return undefined;
      const base = describedSystemBaseUrl.replace(/\/$/, "");
      return new URL(`${base}/${reference.replace(/^\/+/, "")}`).href;
    }
    return new URL(reference, documentUrl).href;
  } catch {
    return undefined;
  }
}

function resolveInitialUrl(value: string): string | undefined {
  try {
    const base = typeof document !== "undefined" ? document.baseURI : undefined;
    return new URL(value, base).href;
  } catch {
    return undefined;
  }
}

function parseAbsoluteBaseUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.search ||
      url.hash
    ) {
      return undefined;
    }
    return url.href;
  } catch {
    return undefined;
  }
}

function resolveBaseUrlReference(
  reference: string,
  baseUrl: string,
): string | undefined {
  try {
    return new URL(reference).href;
  } catch {
    // Continue with ORD relative-reference rules.
  }

  try {
    if (reference.startsWith("//")) {
      return new URL(reference, baseUrl).href;
    }
    const base = baseUrl.replace(/\/$/, "");
    if (reference.startsWith("/")) {
      return new URL(`${base}/${reference.replace(/^\/+/, "")}`).href;
    }
    return new URL(reference, `${base}/`).href;
  } catch {
    return undefined;
  }
}

function getConfigurationBaseUrl(configUrl: string): string {
  const url = new URL(configUrl);
  const suffix = "/.well-known/open-resource-discovery";
  const pathname = url.pathname.replace(/\/$/, "");
  if (pathname.endsWith(suffix)) {
    url.pathname = pathname.slice(0, -suffix.length) || "/";
  }
  url.search = "";
  url.hash = "";
  return url.href.replace(/\/$/, "");
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
