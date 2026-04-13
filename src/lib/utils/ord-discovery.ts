import type { PredefinedServer } from "@lib/types/connection";

interface ORDConfig {
  baseUrl?: string;
  openResourceDiscoveryV1?: {
    documents?: { url: string }[];
  };
}

interface ORDApiResource {
  ordId: string;
  title?: string;
  shortDescription?: string;
  description?: string;
  apiProtocol?: string;
  entryPoints?: string[];
}

interface ORDDocument {
  apiResources?: ORDApiResource[];
}

/**
 * Checks whether a URL looks like an ORD endpoint.
 */
export function isOrdUrl(url: string): boolean {
  return url.includes(".well-known/open-resource-discovery");
}

/**
 * Discovers MCP servers from an Open Resource Discovery endpoint.
 *
 * Accepts a base URL or a full `.well-known/open-resource-discovery` URL.
 * Fetches the ORD config, then each document, and returns all MCP-protocol
 * API resources as PredefinedServer entries.
 *
 * @param idPrefix - Optional prefix for generated IDs (e.g. "custom-" for user-added servers)
 */
export async function discoverServersFromOrd(
  ordUrl: string,
  idPrefix = "",
): Promise<PredefinedServer[]> {
  if (!ordUrl) return [];

  try {
    let configUrl = ordUrl;
    if (!configUrl.includes(".well-known/open-resource-discovery")) {
      configUrl =
        configUrl.replace(/\/$/, "") + "/.well-known/open-resource-discovery";
    }

    const configRes = await fetch(configUrl);
    if (!configRes.ok) return [];
    const config: ORDConfig = await configRes.json();

    const baseUrl = config.baseUrl || new URL(configUrl).origin;
    const docUrls =
      config.openResourceDiscoveryV1?.documents?.map((d) => d.url) ?? [];

    const servers: PredefinedServer[] = [];

    for (const docPath of docUrls) {
      const docUrl = docPath.startsWith("http")
        ? docPath
        : `${baseUrl.replace(/\/$/, "")}${docPath}`;
      const docRes = await fetch(docUrl);
      if (!docRes.ok) continue;
      const doc: ORDDocument = await docRes.json();

      const mcpResources = (doc.apiResources ?? []).filter(
        (r) => r.apiProtocol === "mcp" && r.entryPoints?.length,
      );

      for (const r of mcpResources) {
        servers.push({
          id: `${idPrefix}${r.ordId}`,
          name: r.ordId.split(":").slice(-2).join(":"),
          title: r.title,
          description: r.shortDescription || r.description || "",
          url: r.entryPoints![0],
          transportType: "streamable-http",
          tags: ["ORD"],
        });
      }
    }

    return servers;
  } catch {
    return [];
  }
}
