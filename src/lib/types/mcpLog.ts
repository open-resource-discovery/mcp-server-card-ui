export interface MCPLogEntry {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  requestBody: string;
  requestHeaders?: Record<string, string>;
  responseBody?: string;
  responseStatus?: number;
  durationMs?: number;
  error?: string;
  functionCallId?: string;
  derivedFromLogId?: string;
}
