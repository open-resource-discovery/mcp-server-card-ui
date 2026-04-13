/**
 * MCP Streamable HTTP transport client.
 *
 * Handles:
 * - POST requests with JSON or SSE response detection
 * - POST notifications expecting 202 Accepted
 * - DELETE for session teardown
 * - MCP-Session-Id and MCP-Protocol-Version header management
 */

import { parseSSEStream } from "./sse-parser";
import {
  createRequest,
  createNotification,
  parseResponse,
  type JsonRpcRequest,
  type JsonRpcResponse,
} from "./mcp-jsonrpc";
import { useMCPLogStore } from "@lib/stores/mcpLogStore";
import { v4 as uuidv4 } from "uuid";
import type { MCPLogEntry } from "@lib/types/mcpLog";
import { isMockUrl, handleMockRequest } from "@lib/mock/servers";

export interface MCPTransportConfig {
  url: string;
  protocolVersion?: string;
  sessionId?: string;
  authHeaders?: Record<string, string>;
}

export interface MCPTransportResult {
  response: JsonRpcResponse;
  sessionId?: string;
}

const DEFAULT_PROTOCOL_VERSION = "2025-03-26";

function buildHeaders(config: MCPTransportConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    "MCP-Protocol-Version": config.protocolVersion ?? DEFAULT_PROTOCOL_VERSION,
    ...config.authHeaders,
  };

  if (config.sessionId) {
    headers["MCP-Session-Id"] = config.sessionId;
  }

  return headers;
}

/**
 * Send a JSON-RPC request and return the response.
 * Handles both JSON and SSE response content types.
 */
export async function sendRequest(
  config: MCPTransportConfig,
  method: string,
  params?: Record<string, unknown>,
  functionCallId?: string,
): Promise<MCPTransportResult> {
  const request = createRequest(method, params);
  const headers = buildHeaders(config);
  const body = JSON.stringify(request);

  const logId = uuidv4();
  const logEntry: MCPLogEntry = {
    id: logId,
    timestamp: Date.now(),
    method,
    url: config.url,
    requestBody: body,
    requestHeaders: headers,
    functionCallId,
  };
  useMCPLogStore.getState().addLog(logEntry);

  const startTime = Date.now();

  // Mock transport — handle locally without network
  if (isMockUrl(config.url)) {
    const mockResponse = handleMockRequest(config.url, request);
    const durationMs = Date.now() - startTime;
    useMCPLogStore.getState().updateLog(logId, {
      responseStatus: 200,
      responseBody: JSON.stringify(mockResponse, null, 2),
      durationMs,
    });
    return { response: mockResponse, sessionId: `mock-${config.url}` };
  }

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers,
      body,
    });

    const durationMs = Date.now() - startTime;
    const sessionId =
      response.headers.get("MCP-Session-Id") ?? config.sessionId;
    const contentType = response.headers.get("Content-Type") ?? "";

    if (!response.ok) {
      const errorBody = await response.text();
      useMCPLogStore.getState().updateLog(logId, {
        responseStatus: response.status,
        responseBody: errorBody,
        durationMs,
        error: `HTTP ${response.status}`,
      });
      throw new Error(`MCP request failed: ${response.status} ${errorBody}`);
    }

    let result: JsonRpcResponse;

    if (contentType.includes("text/event-stream")) {
      // SSE response — collect events until we get the JSON-RPC response
      result = await handleSSEResponse(response, request);
    } else {
      // Direct JSON response
      const data = await response.json();
      result = parseResponse(data);
    }

    useMCPLogStore.getState().updateLog(logId, {
      responseStatus: response.status,
      responseBody: JSON.stringify(result, null, 2),
      durationMs,
    });

    return { response: result, sessionId };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    useMCPLogStore.getState().updateLog(logId, {
      durationMs,
      error: errorMsg,
    });
    throw err;
  }
}

/**
 * Send a JSON-RPC notification (no response expected).
 * Expects 202 Accepted from the server.
 */
export async function sendNotification(
  config: MCPTransportConfig,
  method: string,
  params?: Record<string, unknown>,
): Promise<void> {
  const notification = createNotification(method, params);
  const headers = buildHeaders(config);
  const body = JSON.stringify(notification);

  const logId = uuidv4();
  const logEntry: MCPLogEntry = {
    id: logId,
    timestamp: Date.now(),
    method,
    url: config.url,
    requestBody: body,
    requestHeaders: headers,
  };
  useMCPLogStore.getState().addLog(logEntry);

  const startTime = Date.now();

  // Mock transport — notifications are no-ops for mock servers
  if (isMockUrl(config.url)) {
    useMCPLogStore.getState().updateLog(logId, {
      responseStatus: 202,
      durationMs: Date.now() - startTime,
    });
    return;
  }

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers,
      body,
    });

    const durationMs = Date.now() - startTime;

    useMCPLogStore.getState().updateLog(logId, {
      responseStatus: response.status,
      durationMs,
    });

    if (!response.ok && response.status !== 202) {
      const errorBody = await response.text();
      useMCPLogStore.getState().updateLog(logId, {
        responseBody: errorBody,
        error: `HTTP ${response.status}`,
      });
      throw new Error(
        `MCP notification failed: ${response.status} ${errorBody}`,
      );
    }
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    useMCPLogStore.getState().updateLog(logId, {
      durationMs,
      error: errorMsg,
    });
    throw err;
  }
}

/**
 * Send a raw HTTP request (for edit-and-resend from the Raw HTTP tab).
 * Logs the request/response and does NOT throw on errors.
 */
export async function sendRawRequest(
  body: string,
  url: string,
  headers: Record<string, string>,
  derivedFromLogId?: string,
): Promise<void> {
  let method = "unknown";
  try {
    const parsed = JSON.parse(body);
    method = parsed.method ?? "unknown";
  } catch {
    // body might not be valid JSON-RPC — that's fine, log it anyway
  }

  const logId = uuidv4();
  const logEntry: MCPLogEntry = {
    id: logId,
    timestamp: Date.now(),
    method,
    url,
    requestBody: body,
    requestHeaders: headers,
    derivedFromLogId,
  };
  useMCPLogStore.getState().addLog(logEntry);

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    const durationMs = Date.now() - startTime;
    const responseBody = await response.text();

    useMCPLogStore.getState().updateLog(logId, {
      responseStatus: response.status,
      responseBody,
      durationMs,
      ...(response.ok ? {} : { error: `HTTP ${response.status}` }),
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    useMCPLogStore.getState().updateLog(logId, {
      durationMs,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

/**
 * Delete the MCP session (teardown).
 */
export async function deleteSession(config: MCPTransportConfig): Promise<void> {
  if (!config.sessionId) return;
  if (isMockUrl(config.url)) return;

  const headers: Record<string, string> = {
    "MCP-Session-Id": config.sessionId,
    ...config.authHeaders,
  };

  try {
    await fetch(config.url, {
      method: "DELETE",
      headers,
    });
  } catch {
    // Best-effort session teardown
  }
}

/**
 * Handle an SSE response by collecting events until we find the JSON-RPC response.
 */
async function handleSSEResponse(
  response: Response,
  request: JsonRpcRequest,
): Promise<JsonRpcResponse> {
  if (!response.body) {
    throw new Error("No response body for SSE stream");
  }

  for await (const event of parseSSEStream(response.body)) {
    // Look for "message" events or events with no type that contain JSON-RPC data
    if (event.event === "message" || !event.event) {
      try {
        const data = JSON.parse(event.data);
        const rpcResponse = parseResponse(data);
        if (rpcResponse.id === request.id) {
          return rpcResponse;
        }
      } catch {
        // Not a valid JSON-RPC response, continue
      }
    }
  }

  throw new Error("SSE stream ended without a JSON-RPC response");
}
