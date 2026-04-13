export interface FunctionCall {
  id: string;
  type: "tool" | "prompt";
  name: string;
  input: Record<string, unknown>;
  timestamp: number;
  status: "pending" | "completed" | "error";
  result?: ToolCallResult | PromptResult;
  error?: string;
  durationMs?: number;
  logId?: string;
}

export interface ToolCallResult {
  content: ContentItem[];
  isError: boolean;
}

export type ContentItem =
  | TextContent
  | ImageContent
  | AudioContent
  | EmbeddedResource;

export interface TextContent {
  type: "text";
  text: string;
}

export interface ImageContent {
  type: "image";
  data: string;
  mimeType: string;
}

export interface AudioContent {
  type: "audio";
  data: string;
  mimeType: string;
}

export interface EmbeddedResource {
  type: "resource";
  resource: {
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  };
}

export interface PromptMessage {
  role: "user" | "assistant";
  content: ContentItem[];
}

export interface PromptResult {
  messages: PromptMessage[];
}
