// Main entry point — full MCP Server Playground
import "./styles.css";

// Components
export { ThemeRoot } from "./components/ThemeRoot";
export {
  MCPServerCardView,
  type MCPServerCardViewProps,
} from "./components/MCPServerCardView";
export {
  MCPServerViewer,
  type MCPServerViewerProps,
} from "./components/MCPServerViewer";
export {
  MCPServerEditor,
  type MCPServerEditorProps,
} from "./components/MCPServerEditor";
export {
  MCPServerPlayground,
  type MCPServerPlaygroundProps,
} from "./components/MCPServerPlayground";
export {
  MCPServerPlaygroundLite,
  type MCPServerPlaygroundLiteProps,
} from "./components/MCPServerPlaygroundLite";

// Stores
export { useServerCardStore } from "./stores/serverCardStore";
export { useValidationStore } from "./stores/validationStore";
export { useUIStore } from "./stores/uiStore";
export { useEditorSettingsStore } from "./stores/editorSettingsStore";
export { useMCPConnectionStore } from "./stores/mcpConnectionStore";
export { useMCPLogStore } from "./stores/mcpLogStore";
export { useFunctionsStore } from "./stores/functionsStore";

// Hooks
export { useTheme } from "./hooks/useTheme";
export { useMediaQuery, useIsLargeScreen } from "./hooks/useMediaQuery";

// Types
export type {
  ValidationResult,
  ValidationSummary,
  ValidationStatus,
  ValidationSeverity,
  EditorMarker,
} from "./types/validation";

// Re-export MCP protocol types
export type {
  MCPServerCardDefinition,
  Tool,
  Resource,
  Prompt,
  RemoteTransport,
  ServerCapabilities,
  Authentication,
  Icon,
} from "./types/mcp-protocol";

// Connection types
export type {
  AuthType,
  ConnectionStatus,
  BasicCredentials,
  BearerCredentials,
  OAuth2Credentials,
  PredefinedServer,
} from "./types/connection";
export type { MCPLogEntry } from "./types/mcpLog";
export type {
  FunctionCall,
  ToolCallResult,
  PromptResult,
  ContentItem,
} from "./types/functions";

// Utilities
export { cn } from "./utils/cn";
export { validateMCPServerCardSchema } from "./utils/mcp-schema";
