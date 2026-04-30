import type { ValidationResult } from "@lib/types/validation";

/**
 * Validate an MCP Server Card JSON string against the MCP Server Card schema.
 * Returns an array of validation results.
 */
export function validateMCPServerCardSchema(
  rawJson: string,
): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (!rawJson.trim()) {
    return results;
  }

  // Step 1: Parse JSON
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawJson) as Record<string, unknown>;
  } catch (e) {
    results.push({
      id: "json-parse",
      rule: "Valid JSON",
      description: "The input must be valid JSON",
      status: "fail",
      severity: "error",
      message: `JSON parse error: ${e instanceof Error ? e.message : "Unknown error"}`,
      path: "",
    });
    return results;
  }

  // Step 2: Check required root fields
  const requiredFields = [
    { field: "$schema", label: "$schema URI" },
    { field: "name", label: "Server name" },
    { field: "version", label: "Version" },
    { field: "description", label: "Description" },
    {
      field: "supportedProtocolVersions",
      label: "Supported protocol versions",
    },
    { field: "remotes", label: "Remote transports" },
    { field: "capabilities", label: "Server capabilities" },
  ];

  for (const { field, label } of requiredFields) {
    const value = parsed[field];
    if (value === undefined || value === null) {
      results.push({
        id: `required-${field}`,
        rule: `Required field: ${label}`,
        description: `The '${field}' field is required`,
        status: "fail",
        severity: "error",
        message: `Missing required field '${field}'`,
        path: field,
      });
    }
  }

  // Step 3: Validate name format
  if (typeof parsed.name === "string") {
    const namePattern = /^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/;
    if (!namePattern.test(parsed.name)) {
      results.push({
        id: "name-format",
        rule: "Name format",
        description:
          'Name must be in reverse-DNS format (e.g., "sap.com/weather")',
        status: "fail",
        severity: "error",
        message: `Invalid name format: '${parsed.name}'. Expected format: 'namespace/name' (e.g., 'sap.com/weather')`,
        path: "name",
      });
    }
  }

  // Step 4: Validate supportedProtocolVersions
  const validVersions = [
    "2024-11-05",
    "2025-03-26",
    "2025-06-18",
    "2025-11-25",
  ];
  if (Array.isArray(parsed.supportedProtocolVersions)) {
    if (parsed.supportedProtocolVersions.length === 0) {
      results.push({
        id: "protocol-versions-empty",
        rule: "Protocol versions",
        description: "At least one protocol version must be specified",
        status: "fail",
        severity: "error",
        message: "supportedProtocolVersions array must not be empty",
        path: "supportedProtocolVersions",
      });
    }
    for (const v of parsed.supportedProtocolVersions) {
      if (typeof v === "string" && !validVersions.includes(v)) {
        results.push({
          id: `protocol-version-${v}`,
          rule: "Known protocol version",
          description: "Protocol version should be a known MCP version",
          status: "warning",
          severity: "warning",
          message: `Unknown protocol version '${v}'. Known versions: ${validVersions.join(", ")}`,
          path: "supportedProtocolVersions",
        });
      }
    }
  }

  // Step 5: Validate remotes array
  if (Array.isArray(parsed.remotes)) {
    if (parsed.remotes.length === 0) {
      results.push({
        id: "remotes-empty",
        rule: "Remote transports",
        description: "At least one remote transport must be specified",
        status: "fail",
        severity: "error",
        message: "remotes array must not be empty",
        path: "remotes",
      });
    }
    const validTypes = ["streamable-http", "sse"];
    for (let i = 0; i < parsed.remotes.length; i++) {
      const remote = parsed.remotes[i] as Record<string, unknown>;
      if (remote && typeof remote === "object") {
        if (!remote.type || !validTypes.includes(remote.type as string)) {
          results.push({
            id: `remote-type-${i}`,
            rule: "Remote transport type",
            description: "Transport type must be 'streamable-http' or 'sse'",
            status: "fail",
            severity: "error",
            message: `Invalid transport type at remotes[${i}]: '${remote.type}'`,
            path: `remotes.${i}.type`,
          });
        }
        if (!remote.url) {
          results.push({
            id: `remote-url-${i}`,
            rule: "Remote transport URL",
            description: "Each remote transport must have a URL",
            status: "fail",
            severity: "error",
            message: `Missing URL at remotes[${i}]`,
            path: `remotes.${i}.url`,
          });
        }
      }
    }
  }

  // Step 6: Validate tools
  if (Array.isArray(parsed.tools)) {
    for (let i = 0; i < parsed.tools.length; i++) {
      const tool = parsed.tools[i] as Record<string, unknown>;
      if (tool && typeof tool === "object") {
        if (!tool.name) {
          results.push({
            id: `tool-name-${i}`,
            rule: "Tool name",
            description: "Each tool must have a name",
            status: "fail",
            severity: "error",
            message: `Missing name for tool at index ${i}`,
            path: `tools.${i}.name`,
          });
        }
        if (!tool.description) {
          results.push({
            id: `tool-description-${i}`,
            rule: "Tool description",
            description: "Each tool must have a description",
            status: "fail",
            severity: "error",
            message: `Missing description for tool '${tool.name || `[${i}]`}'`,
            path: `tools.${i}.description`,
          });
        }
        if (!tool.inputSchema) {
          results.push({
            id: `tool-inputschema-${i}`,
            rule: "Tool input schema",
            description: "Each tool must have an inputSchema",
            status: "fail",
            severity: "error",
            message: `Missing inputSchema for tool '${tool.name || `[${i}]`}'`,
            path: `tools.${i}.inputSchema`,
          });
        }
      }
    }
  }

  // Step 7: Validate resources
  if (Array.isArray(parsed.resources)) {
    for (let i = 0; i < parsed.resources.length; i++) {
      const resource = parsed.resources[i] as Record<string, unknown>;
      if (resource && typeof resource === "object") {
        if (!resource.uri) {
          results.push({
            id: `resource-uri-${i}`,
            rule: "Resource URI",
            description: "Each resource must have a URI",
            status: "fail",
            severity: "error",
            message: `Missing URI for resource at index ${i}`,
            path: `resources.${i}.uri`,
          });
        }
        if (!resource.name) {
          results.push({
            id: `resource-name-${i}`,
            rule: "Resource name",
            description: "Each resource must have a name",
            status: "fail",
            severity: "error",
            message: `Missing name for resource at index ${i}`,
            path: `resources.${i}.name`,
          });
        }
      }
    }
  }

  // Step 8: Validate authentication consistency
  if (parsed.authentication && typeof parsed.authentication === "object") {
    const auth = parsed.authentication as Record<string, unknown>;
    if (
      Array.isArray(auth.schemas) &&
      auth.schemas.length > 0 &&
      auth.required !== true
    ) {
      results.push({
        id: "auth-consistency",
        rule: "Authentication consistency",
        description: "Auth schemas without required=true is inconsistent",
        status: "warning",
        severity: "warning",
        message:
          "Authentication schemas are defined but 'required' is not set to true",
        path: "authentication",
      });
    }
  }

  // Step 9: Validate description length
  if (
    typeof parsed.description === "string" &&
    parsed.description.length > 100
  ) {
    results.push({
      id: "description-length",
      rule: "Description length",
      description: "Description should not exceed 100 characters",
      status: "warning",
      severity: "warning",
      message: `Description is ${parsed.description.length} characters (max 100)`,
      path: "description",
    });
  }

  // Step 10: Return pass message, if no errors or warnings found

  if (results.length == 0) {
    results.push({
      id: "all-valid",
      rule: "No errors",
      description: "Server card is valid",
      status: "pass",
      message: "Server card is valid",
    });
  }

  return results;
}
