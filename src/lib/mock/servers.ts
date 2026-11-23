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
  serverInfo: { name: string; title?: string; version: string };
  capabilities: Record<string, unknown>;
  handleRequest: (method: string, params?: Record<string, unknown>) => unknown;
}

const echoServer: MockServerDef = {
  serverInfo: { name: "mock/echo", title: "Echo Server", version: "1.0.0" },
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
  serverInfo: {
    name: "mock/weather",
    title: "Weather Server",
    version: "1.2.0",
  },
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

const calculatorServer: MockServerDef = {
  serverInfo: {
    name: "sap.com/calculator",
    title: "Calculator Server",
    version: "0.1.0",
  },
  capabilities: {
    tools: { listChanged: true },
    logging: {},
  },
  handleRequest: (method, params) => {
    switch (method) {
      case "tools/list":
        return {
          tools: [
            {
              name: "calculate",
              title: "Math Calculator",
              description: "Evaluate a math expression",
              inputSchema: {
                type: "object",
                properties: { expression: { type: "string" } },
                required: ["expression"],
              },
            },
            {
              name: "convert_units",
              title: "Unit Converter",
              description: "Convert between units",
              inputSchema: {
                type: "object",
                properties: {
                  value: { type: "number" },
                  from: { type: "string" },
                  to: { type: "string" },
                },
                required: ["value", "from", "to"],
              },
            },
            {
              name: "statistics",
              title: "Statistical Analysis",
              description: "Calculate statistics for a set of numbers",
              inputSchema: {
                type: "object",
                properties: {
                  numbers: { type: "array", items: { type: "number" } },
                },
                required: ["numbers"],
              },
            },
            {
              name: "random_number",
              title: "Random Number Generator",
              description: "Generate a random number in a range",
              inputSchema: {
                type: "object",
                properties: {
                  min: { type: "number" },
                  max: { type: "number" },
                },
                required: ["min", "max"],
              },
            },
          ],
        };
      case "tools/call": {
        const name = params?.name as string;
        const args = params?.arguments as Record<string, unknown> | undefined;

        if (name === "calculate") {
          const expression = args?.expression as string;
          try {
            const result = Function(`"use strict"; return (${expression})`)();
            return {
              content: [{ type: "text", text: String(result) }],
              isError: false,
            };
          } catch {
            return {
              content: [{ type: "text", text: "Invalid expression" }],
              isError: true,
            };
          }
        }

        if (name === "convert_units") {
          const value = args?.value as number;
          const from = (args?.from as string).toLowerCase();
          const to = (args?.to as string).toLowerCase();
          let result: number;
          if (from === "celsius" && to === "fahrenheit")
            result = (value * 9) / 5 + 32;
          else if (from === "fahrenheit" && to === "celsius")
            result = ((value - 32) * 5) / 9;
          else {
            const conversions: Record<string, Record<string, number>> = {
              km: { miles: 0.621371, m: 1000 },
              miles: { km: 1.60934, m: 1609.34 },
              kg: { lbs: 2.20462, g: 1000 },
              lbs: { kg: 0.453592, g: 453.592 },
            };
            const factor = conversions[from]?.[to];
            if (factor === undefined) {
              return {
                content: [
                  { type: "text", text: `Cannot convert ${from} to ${to}` },
                ],
                isError: true,
              };
            }
            result = value * factor;
          }
          return {
            content: [
              {
                type: "text",
                text: `${value} ${from} = ${result.toFixed(4)} ${to}`,
              },
            ],
            isError: false,
          };
        }

        if (name === "statistics") {
          const numbers = args?.numbers as number[];
          if (!numbers?.length)
            return {
              content: [{ type: "text", text: "Empty array" }],
              isError: true,
            };
          const sum = numbers.reduce((a, b) => a + b, 0);
          const mean = sum / numbers.length;
          const sorted = [...numbers].sort((a, b) => a - b);
          const median =
            sorted.length % 2 === 0
              ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
              : sorted[Math.floor(sorted.length / 2)];
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  count: numbers.length,
                  sum,
                  mean,
                  median,
                  min: sorted[0],
                  max: sorted[sorted.length - 1],
                }),
              },
            ],
            isError: false,
          };
        }

        if (name === "random_number") {
          const min = args?.min as number;
          const max = args?.max as number;
          const result = Math.random() * (max - min) + min;
          return {
            content: [{ type: "text", text: String(result) }],
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

const MOCK_SERVERS: Record<string, MockServerDef> = {
  echo: echoServer,
  weather: weatherServer,
  calculator: calculatorServer,
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
const MOCK_SERVER_CARDS: Record<string, string> = {
  calculator: JSON.stringify(
    {
      $schema:
        "https://raw.githubusercontent.com/anthropics/model-context-protocol/refs/heads/main/schema/2025-03-26/schema.json",
      name: "sap.com/calculator",
      title: "Calculator Server",
      version: "0.1.0",
      supportedProtocolVersions: ["2025-03-26"],
      description:
        "Server card auto-generated from live MCP connection to mock/calculator",
      remotes: [{ type: "streamable-http", url: "mock://calculator" }],
      capabilities: { tools: { listChanged: true }, logging: {} },
      tools: [
        {
          name: "calculate",
          title: "Math Calculator",
          description: "Evaluate a math expression",
          inputSchema: {
            type: "object",
            properties: { expression: { type: "string" } },
            required: ["expression"],
            additionalProperties: false,
            $schema: "http://json-schema.org/draft-07/schema#",
          },
          annotations: { readOnlyHint: true, idempotentHint: true },
          execution: { taskSupport: "forbidden" },
        },
        {
          name: "convert_units",
          title: "Unit Converter",
          description: "Convert between units",
          inputSchema: {
            type: "object",
            properties: {
              value: { type: "number" },
              from: { type: "string" },
              to: { type: "string" },
            },
            required: ["value", "from", "to"],
            additionalProperties: false,
            $schema: "http://json-schema.org/draft-07/schema#",
          },
          annotations: { readOnlyHint: true, idempotentHint: true },
          execution: { taskSupport: "forbidden" },
        },
        {
          name: "statistics",
          title: "Statistical Analysis",
          description: "Calculate statistics for a set of numbers",
          inputSchema: {
            type: "object",
            properties: {
              numbers: { type: "array", items: { type: "number" } },
            },
            required: ["numbers"],
            additionalProperties: false,
            $schema: "http://json-schema.org/draft-07/schema#",
          },
          annotations: { readOnlyHint: true, idempotentHint: true },
          execution: { taskSupport: "forbidden" },
        },
        {
          name: "random_number",
          title: "Random Number Generator",
          description: "Generate a random number in a range",
          inputSchema: {
            type: "object",
            properties: { min: { type: "number" }, max: { type: "number" } },
            required: ["min", "max"],
            additionalProperties: false,
            $schema: "http://json-schema.org/draft-07/schema#",
          },
          annotations: { readOnlyHint: true },
          execution: { taskSupport: "forbidden" },
        },
      ],
    },
    null,
    2,
  ),
};

export function getMockServerCard(serverId: string): string | null {
  if (MOCK_SERVER_CARDS[serverId]) return MOCK_SERVER_CARDS[serverId];

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
