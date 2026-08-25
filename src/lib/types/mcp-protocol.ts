/**
 * Vendored types from @sap/mcp-protocol (v0.1.3)
 *
 * These types are temporarily copied from the @sap/mcp-protocol package,
 * which is not yet published to npm. Once the package is open-sourced,
 * this file should be replaced with a proper npm dependency.
 *
 * Source: @sap/mcp-protocol/dist/generated/spec/v1/types/mcp-server-card-spec.d.ts
 */

/**
 * MCP protocol versions supported by this server.
 * This may not match the versions that the client supports.
 * If the client cannot support at least one of the provided versions, it MUST disconnect.
 *
 * @minItems 1
 */
export type SupportedProtocolVersionList = [
  "2024-11-05" | "2025-03-26" | "2025-06-18" | "2025-11-25",
  ...("2024-11-05" | "2025-03-26" | "2025-06-18" | "2025-11-25")[],
];
/**
 * Transport protocol configuration.
 *
 */
export type RemoteTransport = StreamableHttpTransport | SseTransport;
/**
 * The sender or recipient of messages and data in a conversation.
 */
export type Role = "assistant" | "user";
/**
 * This is the schema description of the MCP Server Card
 * format. Its purpose is to describe an MCP server with a single self-contained
 * JSON file.
 */
export interface MCPServerCardDefinition {
  /**
   * Link to the JSON Schema for MCP Server Card file.
   * TODO: Update with correct link when MCP Server Card schema is published (potential examples below).
   * - "https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json"
   * - "https://static.modelcontextprotocol.io/schemas/2025-12-11/server-card.schema.json"
   */
  $schema: string;
  /**
   * Optional identifier for this specific MCP Server Card document.
   */
  $id?: string;
  /**
   * Technical server name used as identifier.
   * Server name in reverse-DNS format. MUST contain exactly one forward slash separating namespace from server name.
   */
  name: string;
  /**
   * Optional human-readable title or display name for the MCP server. MCP sub-registries or clients MAY choose to use this for display purposes.
   */
  title?: string;
  /**
   * Version string for this server. SHOULD follow semantic versioning (e.g., '1.0.2', '2.1.0-alpha').
   * Equivalent of Implementation.version in MCP specification.
   * Non-semantic versions are allowed but may not sort predictably.
   * Version ranges are rejected (e.g., '^1.2.3', '~1.2.3', '>=1.2.3', '1.x', '1.*').
   */
  version: string;
  supportedProtocolVersions: SupportedProtocolVersionList;
  /**
   * Clear human-readable explanation of server functionality. Should focus on capabilities, not implementation details.
   */
  description: string;
  /**
   * Optional set of sized icons that the client can display in a user interface.
   * Clients that support rendering icons MUST support at least the following MIME types: image/png and image/jpeg (safe, universal compatibility).
   * Clients SHOULD also support: image/svg+xml (scalable but requires security precautions) and image/webp (modern, efficient format).
   */
  icons?: Icon[];
  /**
   * Optional URL to the server's homepage, documentation, or project website.
   * This provides a central link for users to learn more about the server.
   * Particularly useful when the server has custom installation instructions or setup requirements.
   */
  websiteUrl?: string;
  remotes: RemoteTransport[];
  capabilities: ServerCapabilities;
  requires?: ClientCapabilities;
  authentication?: Authentication;
  /**
   * Optional instructions or guidelines for clients on how to best interact with this MCP server.
   */
  instructions?: string;
  /**
   * Resources that the MCP server exposes.
   *
   * @minItems 0
   */
  resources?: Resource[];
  /**
   * Tools that the MCP server provides.
   *
   * @minItems 0
   */
  tools?: Tool[];
  /**
   * Prompts that the MCP server provides.
   *
   * @minItems 0
   */
  prompts?: Prompt[];
  _meta?: MetaObject;
}
/**
 * An optionally-sized icon that can be displayed in a user interface.
 */
export interface Icon {
  /**
   * Optional MIME type override if the source MIME type is missing or generic. Must be one of: image/png, image/jpeg, image/jpg, image/svg+xml, image/webp.
   */
  mimeType?:
    "image/png" | "image/jpeg" | "image/jpg" | "image/svg+xml" | "image/webp";
  /**
   * Optional array of strings that specify sizes at which the icon can be used.
   * Each string should be in WxH format (e.g., '48x48', '96x96') or 'any' for scalable formats like SVG. If not provided,
   * the client should assume that the icon can be used at any size.
   */
  sizes?: string[];
  /**
   * A standard URI pointing to an icon resource. Must be an HTTPS URL.
   * Consumers SHOULD take steps to ensure URLs serving icons are from the same domain as the server or a trusted domain.
   * Consumers SHOULD take appropriate precautions when consuming SVGs as they can contain executable JavaScript.
   */
  src: string;
  /**
   * Optional specifier for the theme this icon is designed for.
   * 'light' indicates the icon is designed to be used with a light background, and 'dark' indicates the icon is designed to be used with a dark background.
   *
   * If not provided, the client should assume the icon can be used with any theme.
   */
  theme?: "light" | "dark";
}
/**
 * Streamable HTTP transport configuration.
 */
export interface StreamableHttpTransport {
  type: "streamable-http";
  /**
   * HTTP headers to include.
   */
  headers?: KeyValueInput[];
  /**
   * URL template for the streamable-http transport.
   *
   * TODO: Clarify with upstream spec that this is officially supported.
   *
   * Variables in \{curly_braces\} are resolved based on context:
   * In Package context, they reference argument valueHints, argument names, or environment variable names from the parent Package.
   * In Remote context, they reference variables from the transport's 'variables' object.
   * After variable substitution, this should produce a valid URI.
   */
  url: string;
}
export interface KeyValueInput {
  [k: string]: unknown | undefined;
}
/**
 * Server-Sent Events transport configuration.
 */
export interface SseTransport {
  type: "sse";
  /**
   * HTTP headers to include.
   */
  headers?: KeyValueInput[];
  /**
   * Server-Sent Events endpoint URL template.
   *
   * TODO: Clarify with upstream spec that this is officially supported.
   *
   * Variables in \{curly_braces\} are resolved based on context:
   * In Package context, they reference argument valueHints, argument names, or environment variable names from the parent Package.
   * In Remote context, they reference variables from the transport's 'variables' object. After variable substitution, this should produce a valid URI.
   */
  url: string;
}
/**
 * Capabilities that a server may support. Known capabilities are defined here, in this schema, but this is not a closed set: any server can define its own, additional capabilities.
 */
export interface ServerCapabilities {
  completions?: ServerCompletionsCapability;
  experimental?: ServerExperimentalCapability;
  logging?: ServerLoggingCapability;
  prompts?: ServerPromptsCapability;
  resources?: ServerResourcesCapability;
  tasks?: ServerTasksCapability;
  tools?: ServerToolsCapability;
}
/**
 * Present if the server supports argument autocompletion suggestions.
 */
export interface ServerCompletionsCapability {
  [k: string]: unknown | undefined;
}
/**
 * Experimental, non-standard capabilities that the server supports.
 */
export interface ServerExperimentalCapability {
  [k: string]: unknown | undefined;
}
/**
 * Present if the server supports sending log messages to the client.
 */
export interface ServerLoggingCapability {
  [k: string]: unknown | undefined;
}
/**
 * Present if the server offers any prompt templates.
 */
export interface ServerPromptsCapability {
  /**
   * Whether this server supports notifications for changes to the prompt list.
   */
  listChanged?: boolean;
  [k: string]: unknown | undefined;
}
/**
 * Present if the server offers any resources to read.
 */
export interface ServerResourcesCapability {
  /**
   * Whether this server supports subscribing to resource updates.
   */
  subscribe?: boolean;
  /**
   * Whether this server supports notifications for changes to the resource list.
   */
  listChanged?: boolean;
  [k: string]: unknown | undefined;
}
/**
 * Present if the server supports task-augmented requests.
 */
export interface ServerTasksCapability {
  cancel?: ServerCancelCapability;
  list?: ServerListCapability;
  requests?: ServerRequestsCapability;
  [k: string]: unknown | undefined;
}
/**
 * Whether this server supports CancelTaskRequesttasks/cancel.
 */
export interface ServerCancelCapability {
  [k: string]: unknown | undefined;
}
/**
 * Whether this server supports ListTasksRequesttasks/list.
 */
export interface ServerListCapability {
  [k: string]: unknown | undefined;
}
/**
 * Specifies which request types can be augmented with tasks.
 */
export interface ServerRequestsCapability {
  tools?: ServerRequestsCapabilityTools;
}
/**
 * Task support for tool-related requests.
 */
export interface ServerRequestsCapabilityTools {
  call?: ServerRequestsCapabilityToolsCall;
}
/**
 * Whether the server supports task-augmented CallToolRequesttools/call requests.
 */
export interface ServerRequestsCapabilityToolsCall {
  [k: string]: unknown | undefined;
}
/**
 * Present if the server offers any tools to call.
 */
export interface ServerToolsCapability {
  /**
   * Whether this server supports notifications for changes to the tool list.
   */
  listChanged?: boolean;
  /**
   * Support for dynamic tool registration.
   */
  dynamic?: boolean;
  [k: string]: unknown | undefined;
}
/**
 * Capabilities a client may support. Known capabilities are defined here, in this schema, but this is not a closed set: any client can define its own, additional capabilities.
 */
export interface ClientCapabilities {
  elicitation?: ClientElicitationCapability;
  experimental?: ClientExperimentalCapability;
  roots?: ClientRootsCapability;
  sampling?: ClientSamplingCapability;
  tasks?: ClientTasksCapability;
}
/**
 * Present if the client supports elicitation from the server.
 */
export interface ClientElicitationCapability {
  from?: ClientElicitationCapabilityFrom;
  url?: ClientElicitationCapabilityUrl;
}
export interface ClientElicitationCapabilityFrom {
  [k: string]: unknown | undefined;
}
export interface ClientElicitationCapabilityUrl {
  [k: string]: unknown | undefined;
}
/**
 * Experimental, non-standard capabilities that the client supports.
 */
export interface ClientExperimentalCapability {
  [k: string]: unknown | undefined;
}
/**
 * Present if the client supports listing roots.
 */
export interface ClientRootsCapability {
  /**
   * Whether the client supports notifications for changes to the roots list.
   */
  listChanges?: boolean;
  [k: string]: unknown | undefined;
}
/**
 * Present if the client supports sampling from an LLM.
 */
export interface ClientSamplingCapability {
  context?: Context;
  tools?: Tools;
  [k: string]: unknown | undefined;
}
/**
 * Whether the client supports context inclusion via `includeContext` parameter.
 * If not declared, servers SHOULD only use `includeContext: "none"` (or omit it).
 */
export interface Context {
  [k: string]: unknown | undefined;
}
/**
 * Whether the client supports tool use via `tools` and `toolChoice` parameters.
 */
export interface Tools {
  [k: string]: unknown | undefined;
}
/**
 * Present if the client supports task-augmented requests.
 */
export interface ClientTasksCapability {
  cancel?: ClientCancelCapability;
  list?: ClientListCapability;
  requests?: ClientRequestsCapability;
  [k: string]: unknown | undefined;
}
/**
 * Whether the client supports CancelTaskRequesttasks/cancel.
 */
export interface ClientCancelCapability {
  [k: string]: unknown | undefined;
}
/**
 * Whether the client supports ListTasksRequesttasks/list.
 */
export interface ClientListCapability {
  [k: string]: unknown | undefined;
}
/**
 * Specifies which request types can be augmented with tasks.
 */
export interface ClientRequestsCapability {
  elicitation?: ClientRequestsCapabilityElicitation;
  sampling?: ClientRequestsCapabilitySampling;
}
/**
 * Task support for elicitation-related requests.
 */
export interface ClientRequestsCapabilityElicitation {
  create?: ClientRequestsCapabilityElicitationCreate;
}
/**
 * Whether the client supports task-augmented ElicitRequestelicitation/create requests.
 */
export interface ClientRequestsCapabilityElicitationCreate {
  [k: string]: unknown | undefined;
}
/**
 * Task support for sampling-related requests.
 */
export interface ClientRequestsCapabilitySampling {
  createMessage?: ClientRequestsCapabilitySamplingCreateMessage;
}
/**
 * Whether the client supports task-augmented `sampling/createMessage` requests.
 */
export interface ClientRequestsCapabilitySamplingCreateMessage {
  [k: string]: unknown | undefined;
}
/**
 * Authentication requirements by the MCP server.
 */
export interface Authentication {
  /**
   * Whether authentication is required to connect to the MCP server.
   */
  required: boolean;
  /**
   * Supported authentication schemas.
   * Must be provided if `required` is true.
   */
  schemas?: ("basic" | "bearer" | "oauth2")[];
}
/**
 * A known resource that the server is capable of reading.
 */
export interface Resource {
  _meta?: MetaObject;
  annotations?: Annotations;
  /**
   * A description of what this resource represents.
   * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
   */
  description?: string;
  /**
   * Optional set of sized icons that the client can display in a user interface.
   * Clients that support rendering icons MUST support at least the following MIME types:
   * - `image/png` - PNG images (safe, universal compatibility)
   * - `image/jpeg` (and `image/jpg`) - JPEG images (safe, universal compatibility)
   * Clients that support rendering icons SHOULD also support:
   * - `image/svg+xml` - SVG images (scalable but requires security precautions)
   * - `image/webp` - WebP images (modern, efficient format)
   */
  icons?: Icon[];
  /**
   * MIME type of the resource (e.g. image/jpeg).
   */
  mimeType?: string;
  /**
   * Identifier / name of the resource.
   */
  name: string;
  /**
   * The size of the raw resource content, in bytes (i.e., before base64 encoding or any tokenization), if known.
   * This can be used by Hosts to display file sizes and estimate context window usage.
   */
  size?: number;
  /**
   * UI-friendly display title for the resource.
   */
  title?: string;
  /**
   * Resource URI.
   */
  uri: string;
}
/**
 * Represents the contents of a `_meta` field, which clients and servers use to attach additional metadata to their interactions.
 * Certain key names are reserved by MCP for protocol-level metadata; implementations MUST NOT make assumptions about values at these keys.
 * Additionally, specific schema definitions may reserve particular names for purpose-specific metadata, as declared in those definitions.
 *
 * Valid keys have two segments:
 *
 * **Prefix:** - Optional — if specified, MUST be a series of _labels_ separated by dots (`.`), followed by a slash (`/`).
 * - Labels MUST start with a letter and end with a letter or digit. Interior characters may be letters, digits, or hyphens (`-`).
 * - Any prefix consisting of zero or more labels, followed by `modelcontextprotocol` or `mcp`, followed by any label, is **reserved** for MCP use. For example: `modelcontextprotocol.io/`, `mcp.dev/`, `api.modelcontextprotocol.org/`, and `tools.mcp.com/` are all reserved.
 *
 * **Name:**
 * - Unless empty, MUST start and end with an alphanumeric character (`[a-z0-9A-Z]`).
 * - Interior characters may be alphanumeric, hyphens (`-`), underscores (`_`), or dots (`.`).
 */
export interface MetaObject {
  [k: string]: unknown | undefined;
}
/**
 * Optional annotations for the client. The client can use annotations to inform how objects are used or displayed.
 */
export interface Annotations {
  /**
   * Describes who the intended audience of this object or data is.
   * It can include multiple entries to indicate content useful for multiple audiences (e.g., `["user", "assistant"]`).
   */
  audience?: Role[];
  /**
   * The moment the resource was last modified, as an ISO 8601 formatted string.
   * Should be an ISO 8601 formatted string (e.g., "2025-01-12T15:00:58Z").
   *
   * Examples: last activity timestamp in an open file, timestamp when the resource
   * was attached, etc.
   */
  lastModified?: string;
  /**
   * Describes how important this data is for operating the server.
   * A value of 1 means "most important," and indicates that the data is
   * effectively required, while 0 means "least important," and indicates that
   * the data is entirely optional.
   */
  priority?: number;
}
/**
 * Definition for a tool the client can call.
 */
export interface Tool {
  _meta?: MetaObject;
  annotations?: ToolAnnotations;
  /**
   * A human-readable description of the tool.
   *
   * This can be used by clients to improve the LLM's understanding of available tools. It can be thought of like a "hint" to the model.
   */
  description: string;
  execution?: ToolExecution;
  /**
   * Optional icons for use in user interfaces.
   */
  icons?: Icon[];
  /**
   * Intended for programmatic or logical use, but used as a display name in past specs or fallback (if title isn't present).
   */
  name: string;
  /**
   * Intended for UI and end-user contexts — optimized to be human-readable and easily understood,
   * even by those unfamiliar with domain-specific terminology.
   * If not provided, the name should be used for display (except for Tool,
   * where `annotations.title` should be given precedence over using `name`,
   * if present).
   */
  title?: string;
  inputSchema: JsonSchema;
  outputSchema?: JsonSchema;
}
/**
 * Additional properties describing a Tool to clients.
 * NOTE: all properties in `ToolAnnotations` are **hints**.
 * They are not guaranteed to provide a faithful description of
 * tool behavior (including descriptive properties like `title`).
 * Clients should never make tool use decisions based on `ToolAnnotations`
 * received from untrusted servers.
 */
export interface ToolAnnotations {
  /**
   * If true, the tool may perform destructive updates to its environment.
   * If false, the tool performs only additive updates.
   * (This property is meaningful only when `readOnlyHint == false`)
   * Default: true
   */
  destructiveHint?: boolean;
  /**
   * If true, calling the tool repeatedly with the same arguments
   * will have no additional effect on its environment.
   * (This property is meaningful only when `readOnlyHint == false`)
   * Default: false
   */
  idempotentHint?: boolean;
  /**
   * If true, this tool may interact with an "open world" of external
   * entities. If false, the tool's domain of interaction is closed.
   * For example, the world of a web search tool is open, whereas that
   * of a memory tool is not.
   * Default: true
   */
  openWorldHint?: boolean;
  /**
   * If true, the tool does not modify its environment. Default: false
   */
  readOnlyHint?: boolean;
  /**
   * A human-readable title for the tool.
   */
  title?: string;
}
/**
 * Execution-related properties for a tool.
 */
export interface ToolExecution {
  /**
   * Indicates whether this tool supports task-augmented execution.
   * This allows clients to handle long-running operations through polling
   * the task system.
   * - `"forbidden"`: Tool does not support task-augmented execution (default when absent)
   * - `"optional"`: Tool may support task-augmented execution
   * - `"required"`: Tool requires task-augmented execution
   *
   * Default: `"forbidden"`
   */
  taskSupport?: "forbidden" | "optional" | "required";
}
/**
 * Embedded JSON Schema used to describe tool input or output.
 * The structure is intentionally kept open so that any valid JSON Schema can be embedded.
 */
export interface JsonSchema {
  type: "object" | "array";
  $schema?: string;
  properties?: JsonSchemaProperties;
  required?: string[];
  [k: string]: unknown | undefined;
}
export interface JsonSchemaProperties {
  [k: string]: unknown | undefined;
}
/**
 * A prompt provided by the MCP server.
 */
export interface Prompt {
  _meta?: MetaObject;
  /**
   * A list of arguments to use for templating the prompt.
   */
  arguments?: PromptArgument[];
  /**
   * An optional description of what this prompt provides
   */
  description?: string;
  /**
   * Optional set of sized icons that the client can display in a user interface.
   * Clients that support rendering icons MUST support at least the following MIME types:
   * - `image/png` - PNG images (safe, universal compatibility)
   * - `image/jpeg` (and `image/jpg`) - JPEG images (safe, universal compatibility)
   * Clients that support rendering icons SHOULD also support:
   * - `image/svg+xml` - SVG images (scalable but requires security precautions)
   * - `image/webp` - WebP images (modern, efficient format)
   */
  icons?: Icon[];
  /**
   * Intended for programmatic or logical use, but used as a display name in past specs or fallback (if title isn't present).
   */
  name: string;
  /**
   * Intended for UI and end-user contexts — optimized to be human-readable and easily understood,
   * even by those unfamiliar with domain-specific terminology.
   * If not provided, the name should be used for display (except for Tool,
   * where `annotations.title` should be given precedence over using `name`, if present).
   */
  title?: string;
}
/**
 * Describes an argument that a prompt can accept.
 */
export interface PromptArgument {
  /**
   * A human-readable description of the argument.
   */
  description?: string;
  /**
   * Intended for programmatic or logical use, but used as a display name in past specs or fallback (if title isn't present).
   */
  name: string;
  /**
   * Whether this argument is required.
   */
  required?: boolean;
  /**
   * Intended for UI and end-user contexts — optimized to be human-readable and easily understood,
   * even by those unfamiliar with domain-specific terminology.
   * If not provided, the name should be used for display (except for Tool,
   * where `annotations.title` should be given precedence over using `name`,
   * if present).
   */
  title?: string;
}
