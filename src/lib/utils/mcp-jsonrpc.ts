/**
 * JSON-RPC 2.0 message builders for MCP protocol communication.
 */

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

let nextId = 1;

export function resetIdCounter(): void {
  nextId = 1;
}

export function createRequest(
  method: string,
  params?: Record<string, unknown>,
): JsonRpcRequest {
  return {
    jsonrpc: "2.0",
    id: nextId++,
    method,
    params,
  };
}

export function createNotification(
  method: string,
  params?: Record<string, unknown>,
): JsonRpcNotification {
  return {
    jsonrpc: "2.0",
    method,
    params,
  };
}

export function parseResponse(data: unknown): JsonRpcResponse {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid JSON-RPC response: not an object");
  }

  const obj = data as Record<string, unknown>;

  if (obj.jsonrpc !== "2.0") {
    throw new Error("Invalid JSON-RPC response: missing jsonrpc 2.0");
  }

  if (typeof obj.id !== "number") {
    throw new Error("Invalid JSON-RPC response: missing or invalid id");
  }

  if (obj.error !== undefined && obj.result !== undefined) {
    throw new Error("Invalid JSON-RPC response: both result and error present");
  }

  return obj as unknown as JsonRpcResponse;
}

export function isErrorResponse(response: JsonRpcResponse): boolean {
  return response.error !== undefined;
}
