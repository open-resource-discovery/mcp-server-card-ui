/**
 * Mock MCP servers for client-side testing.
 *
 * When a URL starts with "mock://", requests are handled locally
 * instead of going over the network.
 */

import type { JsonRpcRequest, JsonRpcResponse } from "@lib/utils/mcp-jsonrpc";

export const MOCK_URL_PREFIX = "mock://";

export function isMockUrl(url: string): boolean {
  return url.startsWith(MOCK_URL_PREFIX);
}

function getMockServerId(url: string): string {
  return url.replace(MOCK_URL_PREFIX, "").replace(/\/$/, "");
}

interface MockServerDef {
  serverInfo: { name: string; version: string };
  capabilities: Record<string, unknown>;
  handleRequest: (method: string, params?: Record<string, unknown>) => unknown;
}

const echoServer: MockServerDef = {
  serverInfo: { name: "Echo Server", version: "1.0.0" },
  capabilities: {
    tools: { listChanged: false },
  },
  handleRequest: (method, params) => {
    switch (method) {
      case "tools/list":
        return {
          tools: [
            {
              name: "echo",
              description: "Echoes back the input text",
              inputSchema: {
                type: "object",
                properties: {
                  text: { type: "string", description: "Text to echo" },
                },
                required: ["text"],
              },
            },
          ],
        };
      case "tools/call": {
        const name = params?.name as string;
        const args = params?.arguments as Record<string, unknown> | undefined;
        if (name === "echo") {
          return {
            content: [{ type: "text", text: `Echo: ${args?.text ?? ""}` }],
            isError: false,
          };
        }
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
      }
      default:
        return null;
    }
  },
};

const weatherServer: MockServerDef = {
  serverInfo: { name: "Weather Server", version: "1.2.0" },
  capabilities: {
    tools: { listChanged: false },
    resources: { subscribe: false, listChanged: false },
    prompts: { listChanged: false },
  },
  handleRequest: (method, params) => {
    switch (method) {
      case "tools/list":
        return {
          tools: [
            {
              name: "get_weather",
              title: "Get Current Weather",
              description: "Returns current weather conditions for a city.",
              inputSchema: {
                type: "object",
                properties: {
                  city: { type: "string", description: "City name" },
                  units: {
                    type: "string",
                    enum: ["celsius", "fahrenheit"],
                    default: "celsius",
                  },
                },
                required: ["city"],
              },
            },
            {
              name: "get_forecast",
              title: "Get Weather Forecast",
              description: "Returns a multi-day weather forecast.",
              inputSchema: {
                type: "object",
                properties: {
                  city: { type: "string" },
                  days: { type: "integer", minimum: 1, maximum: 7, default: 3 },
                },
                required: ["city"],
              },
            },
          ],
        };
      case "tools/call": {
        const name = params?.name as string;
        const args = params?.arguments as Record<string, unknown> | undefined;
        const city = (args?.city as string) ?? "Unknown";
        const temp = Math.floor(Math.random() * 35) - 5;
        const conditions = [
          "Sunny",
          "Cloudy",
          "Rainy",
          "Partly Cloudy",
          "Snowy",
        ];
        const condition =
          conditions[Math.floor(Math.random() * conditions.length)];

        if (name === "get_weather") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  temperature: temp,
                  condition,
                  humidity: Math.floor(Math.random() * 60) + 30,
                  wind_kmh: Math.floor(Math.random() * 30) + 5,
                  city,
                }),
              },
            ],
            isError: false,
          };
        }
        if (name === "get_forecast") {
          const days = (args?.days as number) ?? 3;
          const forecast = Array.from({ length: days }, (_, i) => ({
            day: i + 1,
            high: temp + Math.floor(Math.random() * 5),
            low: temp - Math.floor(Math.random() * 5),
            condition:
              conditions[Math.floor(Math.random() * conditions.length)],
          }));
          return {
            content: [
              { type: "text", text: JSON.stringify({ city, forecast }) },
            ],
            isError: false,
          };
        }
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
      }
      case "resources/list":
        return {
          resources: [
            {
              uri: "resource://weather/supported-cities",
              name: "supported_cities",
              title: "Supported Cities",
              description: "List of all cities with available weather data.",
              mimeType: "application/json",
            },
          ],
        };
      case "resources/read": {
        const uri = params?.uri as string;
        if (uri === "resource://weather/supported-cities") {
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify([
                  "Berlin",
                  "Tokyo",
                  "Paris",
                  "London",
                  "New York",
                  "Sydney",
                ]),
              },
            ],
          };
        }
        return { contents: [] };
      }
      case "prompts/list":
        return {
          prompts: [
            {
              name: "weather_report",
              title: "Weather Report",
              description: "Generates a formatted weather report for a city.",
              arguments: [
                {
                  name: "city",
                  description: "The city to report on",
                  required: true,
                },
                {
                  name: "format",
                  description: "'brief' or 'detailed'",
                  required: false,
                },
              ],
            },
          ],
        };
      case "prompts/get": {
        const promptName = params?.name as string;
        const promptArgs = params?.arguments as
          | Record<string, string>
          | undefined;
        if (promptName === "weather_report") {
          const city = promptArgs?.city ?? "Unknown";
          const format = promptArgs?.format ?? "brief";
          const temp = Math.floor(Math.random() * 35) - 5;
          if (format === "detailed") {
            return {
              messages: [
                {
                  role: "user",
                  content: {
                    type: "text",
                    text: `Generate a detailed weather report for ${city}`,
                  },
                },
                {
                  role: "assistant",
                  content: {
                    type: "text",
                    text: `# Weather Report: ${city}\n\n**Temperature:** ${temp}°C\n**Condition:** Partly Cloudy\n**Humidity:** ${Math.floor(Math.random() * 40) + 40}%\n**Wind:** ${Math.floor(Math.random() * 20) + 5} km/h NW\n**UV Index:** ${Math.floor(Math.random() * 8) + 1}\n**Visibility:** ${Math.floor(Math.random() * 5) + 8} km`,
                  },
                },
              ],
            };
          }
          return {
            messages: [
              {
                role: "user",
                content: { type: "text", text: `Weather for ${city}?` },
              },
              {
                role: "assistant",
                content: {
                  type: "text",
                  text: `${city}: ${temp}°C, Partly Cloudy`,
                },
              },
            ],
          };
        }
        return { messages: [] };
      }
      default:
        return null;
    }
  },
};

const MOCK_SERVERS: Record<string, MockServerDef> = {
  echo: echoServer,
  weather: weatherServer,
};

/**
 * Handle a mock JSON-RPC request and return a response.
 */
export function handleMockRequest(
  url: string,
  request: JsonRpcRequest,
): JsonRpcResponse {
  const serverId = getMockServerId(url);
  const server = MOCK_SERVERS[serverId];

  if (!server) {
    return {
      jsonrpc: "2.0",
      id: request.id,
      error: { code: -32600, message: `Mock server "${serverId}" not found` },
    };
  }

  // Handle initialize
  if (request.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        protocolVersion: "2025-03-26",
        serverInfo: server.serverInfo,
        capabilities: server.capabilities,
      },
    };
  }

  // Handle notifications
  if (request.method === "notifications/initialized") {
    return { jsonrpc: "2.0", id: request.id, result: {} };
  }

  const result = server.handleRequest(request.method, request.params);

  if (result === null) {
    return {
      jsonrpc: "2.0",
      id: request.id,
      error: { code: -32601, message: `Method not found: ${request.method}` },
    };
  }

  return {
    jsonrpc: "2.0",
    id: request.id,
    result,
  };
}

/**
 * Get a mock server's card JSON for display.
 */
export function getMockServerCard(serverId: string): string | null {
  const server = MOCK_SERVERS[serverId];
  if (!server) return null;

  const card = {
    $schema:
      "https://pages.github.tools.sap/CPA/mcp-protocol/spec-v1/mcp-server-card-spec.schema.json",
    name: `mock/${serverId}`,
    title: server.serverInfo.name,
    version: server.serverInfo.version,
    description: `Mock ${serverId} server for testing.`,
    supportedProtocolVersions: ["2025-03-26"],
    remotes: [{ type: "streamable-http", url: `mock://${serverId}` }],
    capabilities: server.capabilities,
  };

  return JSON.stringify(card, null, 2);
}
