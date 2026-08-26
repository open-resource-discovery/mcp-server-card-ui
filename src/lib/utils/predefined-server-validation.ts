import type { AuthType, PredefinedServer } from "@lib/types/connection";

type JsonObject = Record<string, unknown>;

export interface PredefinedServerIssue {
  source: string;
  message: string;
  path?: string;
  serverId?: string;
  serverIndex?: number;
}

export interface PredefinedServerValidationResult {
  servers: PredefinedServer[];
  issues: PredefinedServerIssue[];
}

export function formatPredefinedServerIssue(
  issue: PredefinedServerIssue,
): string {
  const server =
    issue.serverId !== undefined
      ? `server "${issue.serverId}"`
      : issue.serverIndex !== undefined
        ? `server at index ${issue.serverIndex}`
        : undefined;
  const context = [issue.source, server, issue.path].filter(Boolean).join(", ");
  return `${context}: ${issue.message}`;
}

export function validatePredefinedServers(
  value: unknown,
  source: string,
): PredefinedServerValidationResult {
  const result: PredefinedServerValidationResult = {
    servers: [],
    issues: [],
  };
  if (!Array.isArray(value)) {
    result.issues.push({
      source,
      path: "$",
      message: `Expected an array; received ${valueType(value)}.`,
    });
    return result;
  }

  for (let index = 0; index < value.length; index++) {
    parsePredefinedServer(value[index], index, source, result);
  }
  const uniqueServers: PredefinedServer[] = [];
  const seenIds = new Set<string>();
  for (const server of result.servers) {
    if (seenIds.has(server.id)) {
      result.issues.push({
        source,
        serverId: server.id,
        path: "id",
        message: "Duplicate server ID. The later server was skipped.",
      });
      continue;
    }
    seenIds.add(server.id);
    uniqueServers.push(server);
  }
  result.servers = uniqueServers;
  return result;
}

function parsePredefinedServer(
  value: unknown,
  serverIndex: number,
  source: string,
  result: PredefinedServerValidationResult,
): void {
  if (!isJsonObject(value)) {
    result.issues.push({
      source,
      serverIndex,
      path: `[${serverIndex}]`,
      message: `Expected a JSON object; received ${valueType(value)}.`,
    });
    return;
  }

  const serverId =
    typeof value.id === "string" && value.id.trim() !== ""
      ? value.id
      : undefined;
  const initialIssueCount = result.issues.length;
  const id = readRequiredString(
    value,
    "id",
    false,
    source,
    serverId,
    serverIndex,
    result.issues,
  );
  const name = readRequiredString(
    value,
    "name",
    false,
    source,
    serverId,
    serverIndex,
    result.issues,
  );
  const description = readRequiredString(
    value,
    "description",
    true,
    source,
    serverId,
    serverIndex,
    result.issues,
  );
  const url = readRequiredString(
    value,
    "url",
    false,
    source,
    serverId,
    serverIndex,
    result.issues,
  );
  const transportType = readTransportType(
    value.transportType,
    source,
    serverId,
    serverIndex,
    result.issues,
  );
  const title = readOptionalString(
    value,
    "title",
    source,
    serverId,
    serverIndex,
    result.issues,
  );
  const iconUrl = readOptionalString(
    value,
    "iconUrl",
    source,
    serverId,
    serverIndex,
    result.issues,
  );
  const urlSuffix = readOptionalString(
    value,
    "urlSuffix",
    source,
    serverId,
    serverIndex,
    result.issues,
  );
  const serverCard = readOptionalString(
    value,
    "serverCard",
    source,
    serverId,
    serverIndex,
    result.issues,
  );
  const authType = readAuthType(
    value.authType,
    source,
    serverId,
    serverIndex,
    result.issues,
  );
  const authConfig = readOptionalStringRecord(
    value.authConfig,
    "authConfig",
    source,
    serverId,
    serverIndex,
    result.issues,
  );
  const authHeaders = readOptionalStringRecord(
    value.authHeaders,
    "authHeaders",
    source,
    serverId,
    serverIndex,
    result.issues,
  );
  const tags = readOptionalStringArray(
    value.tags,
    "tags",
    source,
    serverId,
    serverIndex,
    result.issues,
  );
  const mocked = readOptionalBoolean(
    value.mocked,
    "mocked",
    source,
    serverId,
    serverIndex,
    result.issues,
  );

  if (
    result.issues.length !== initialIssueCount ||
    id === undefined ||
    name === undefined ||
    description === undefined ||
    url === undefined ||
    transportType === undefined
  ) {
    return;
  }

  result.servers.push({
    id,
    name,
    description,
    url,
    transportType,
    ...(title !== undefined ? { title } : {}),
    ...(iconUrl !== undefined ? { iconUrl } : {}),
    ...(authType !== undefined ? { authType } : {}),
    ...(authConfig !== undefined ? { authConfig } : {}),
    ...(authHeaders !== undefined ? { authHeaders } : {}),
    ...(urlSuffix !== undefined ? { urlSuffix } : {}),
    ...(tags !== undefined ? { tags } : {}),
    ...(mocked !== undefined ? { mocked } : {}),
    ...(serverCard !== undefined ? { serverCard } : {}),
  });
}

function readRequiredString(
  object: JsonObject,
  key: string,
  allowEmpty: boolean,
  source: string,
  serverId: string | undefined,
  serverIndex: number,
  issues: PredefinedServerIssue[],
): string | undefined {
  const value = object[key];
  if (typeof value === "string" && (allowEmpty || value.trim() !== "")) {
    return value;
  }
  issues.push({
    source,
    serverId,
    serverIndex,
    path: `[${serverIndex}].${key}`,
    message: `Expected ${allowEmpty ? "a string" : "a non-empty string"}; received ${valueType(value)}.`,
  });
  return undefined;
}

function readOptionalString(
  object: JsonObject,
  key: string,
  source: string,
  serverId: string | undefined,
  serverIndex: number,
  issues: PredefinedServerIssue[],
): string | undefined {
  const value = object[key];
  if (value === undefined) return undefined;
  if (typeof value === "string") return value;
  issues.push({
    source,
    serverId,
    serverIndex,
    path: `[${serverIndex}].${key}`,
    message: `Expected a string; received ${valueType(value)}.`,
  });
  return undefined;
}

function readTransportType(
  value: unknown,
  source: string,
  serverId: string | undefined,
  serverIndex: number,
  issues: PredefinedServerIssue[],
): PredefinedServer["transportType"] | undefined {
  if (value === "streamable-http" || value === "sse") return value;
  issues.push({
    source,
    serverId,
    serverIndex,
    path: `[${serverIndex}].transportType`,
    message: `Expected "streamable-http" or "sse"; received ${valueType(value)}.`,
  });
  return undefined;
}

function readAuthType(
  value: unknown,
  source: string,
  serverId: string | undefined,
  serverIndex: number,
  issues: PredefinedServerIssue[],
): AuthType | undefined {
  if (value === undefined) return undefined;
  if (
    value === "none" ||
    value === "basic" ||
    value === "bearer" ||
    value === "oauth2"
  ) {
    return value;
  }
  issues.push({
    source,
    serverId,
    serverIndex,
    path: `[${serverIndex}].authType`,
    message: `Expected "none", "basic", "bearer", or "oauth2"; received ${valueType(value)}.`,
  });
  return undefined;
}

function readOptionalStringRecord(
  value: unknown,
  key: string,
  source: string,
  serverId: string | undefined,
  serverIndex: number,
  issues: PredefinedServerIssue[],
): Record<string, string> | undefined {
  if (value === undefined) return undefined;
  if (!isJsonObject(value)) {
    issues.push({
      source,
      serverId,
      serverIndex,
      path: `[${serverIndex}].${key}`,
      message: `Expected an object containing string values; received ${valueType(value)}.`,
    });
    return undefined;
  }

  let valid = true;
  const parsed: Record<string, string> = {};
  for (const [entryKey, entryValue] of Object.entries(value)) {
    if (typeof entryValue === "string") {
      parsed[entryKey] = entryValue;
    } else {
      valid = false;
      issues.push({
        source,
        serverId,
        serverIndex,
        path: `[${serverIndex}].${key}.${entryKey}`,
        message: `Expected a string; received ${valueType(entryValue)}.`,
      });
    }
  }
  return valid ? parsed : undefined;
}

function readOptionalStringArray(
  value: unknown,
  key: string,
  source: string,
  serverId: string | undefined,
  serverIndex: number,
  issues: PredefinedServerIssue[],
): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    issues.push({
      source,
      serverId,
      serverIndex,
      path: `[${serverIndex}].${key}`,
      message: `Expected an array of strings; received ${valueType(value)}.`,
    });
    return undefined;
  }

  let valid = true;
  const parsed: string[] = [];
  for (let index = 0; index < value.length; index++) {
    const entry = value[index];
    if (typeof entry === "string") {
      parsed.push(entry);
    } else {
      valid = false;
      issues.push({
        source,
        serverId,
        serverIndex,
        path: `[${serverIndex}].${key}[${index}]`,
        message: `Expected a string; received ${valueType(value[index])}.`,
      });
    }
  }
  return valid ? parsed : undefined;
}

function readOptionalBoolean(
  value: unknown,
  key: string,
  source: string,
  serverId: string | undefined,
  serverIndex: number,
  issues: PredefinedServerIssue[],
): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  issues.push({
    source,
    serverId,
    serverIndex,
    path: `[${serverIndex}].${key}`,
    message: `Expected a boolean; received ${valueType(value)}.`,
  });
  return undefined;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}
