import React, { useEffect, useRef, useId, useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";

type DemoType =
  "playground" | "playground-lite" | "editor" | "viewer" | "card-view";

interface ComponentDemoProps {
  type: DemoType;
  height?: string;
}

// Sample MCP server card for demos
const mockServerCard = JSON.stringify(
  {
    $schema:
      "https://pages.github.tools.sap/CPA/mcp-protocol/spec-v1/mcp-server-card-spec.schema.json",
    name: "sap.com/weather",
    title: "Weather Service",
    version: "1.2.0",
    description:
      "MCP server providing weather data and forecasts for cities worldwide.",
    supportedProtocolVersions: ["2025-11-25"],
    websiteUrl: "https://weather.example.com",
    remotes: [
      {
        type: "streamable-http",
        url: "https://api.weather.example.com/mcp",
      },
    ],
    capabilities: {
      tools: { listChanged: false },
      resources: { subscribe: false, listChanged: false },
    },
    authentication: {
      required: true,
      schemas: ["bearer", "oauth2"],
    },
    instructions:
      "Use get_weather for current conditions and get_forecast for multi-day forecasts.",
    tools: [
      {
        name: "get_weather",
        title: "Get Current Weather",
        description: "Returns current weather conditions for a city.",
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
        },
        inputSchema: {
          type: "object",
          properties: {
            city: {
              type: "string",
              description: "City name",
            },
          },
          required: ["city"],
        },
      },
      {
        name: "get_forecast",
        title: "Get Weather Forecast",
        description: "Returns a multi-day weather forecast for a given city.",
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
        },
        inputSchema: {
          type: "object",
          properties: {
            city: {
              type: "string",
              description: "City name",
            },
            days: {
              type: "number",
              description: "Number of days (1-7)",
              default: 3,
            },
          },
          required: ["city"],
        },
      },
    ],
    resources: [
      {
        name: "supported-cities",
        uri: "weather://cities",
        title: "Supported Cities",
        description: "List of all supported city names.",
        mimeType: "application/json",
      },
    ],
    prompts: [
      {
        name: "weather_report",
        title: "Weather Report",
        description: "Generates a natural language weather report for a city.",
        arguments: [
          {
            name: "city",
            description: "City name",
            required: true,
          },
          {
            name: "style",
            description: "Report style (brief or detailed)",
            required: false,
          },
        ],
      },
    ],
  },
  null,
  2,
);

function getDocusaurusTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function ComponentBasedDemo({
  type,
  height,
}: {
  type: DemoType;
  height: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const uniqueId = useId().replace(/:/g, "-");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cssUrl = useBaseUrl("/standalone/mcp-server-card-ui.css");
  const jsUrl = useBaseUrl("/standalone/mcp-server-card-ui.js");

  useEffect(() => {
    let mounted = true;

    const loadAndInit = async () => {
      try {
        // Load CSS if not already loaded
        if (!document.querySelector(`link[href="${cssUrl}"]`)) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = cssUrl;
          document.head.appendChild(link);
        }

        // Wait for MCPPlayground to be available
        if (!(window as any).MCPPlayground) {
          await new Promise<void>((resolve, reject) => {
            const existingScript = document.querySelector(
              `script[src="${jsUrl}"]`,
            );
            if (existingScript) {
              const checkInterval = setInterval(() => {
                if ((window as any).MCPPlayground) {
                  clearInterval(checkInterval);
                  resolve();
                }
              }, 50);
              setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error("Timeout waiting for MCPPlayground"));
              }, 10000);
              return;
            }

            const script = document.createElement("script");
            script.src = jsUrl;
            script.onload = () => setTimeout(resolve, 100);
            script.onerror = () =>
              reject(new Error("Failed to load MCPPlayground script"));
            document.body.appendChild(script);
          });
        }

        if (!mounted || !containerRef.current) return;

        const theme = getDocusaurusTheme();
        const MCP = (window as any).MCPPlayground;

        switch (type) {
          case "playground":
            instanceRef.current = MCP.init({
              el: containerRef.current,
              serverCard: mockServerCard,
              showSettings: true,
              showEditor: true,
              showFunctions: true,
              showRawHttp: true,
              theme,
            });
            break;

          case "playground-lite":
            instanceRef.current = MCP.init({
              el: containerRef.current,
              serverCard: mockServerCard,
              showSettings: false,
              showEditor: true,
              showFunctions: false,
              showRawHttp: false,
              showValidation: true,
              theme,
            });
            break;

          case "editor":
            instanceRef.current = MCP.editor({
              el: containerRef.current,
              serverCard: mockServerCard,
              showValidation: true,
              theme,
            });
            break;

          case "viewer":
            instanceRef.current = MCP.viewer({
              el: containerRef.current,
              serverCard: mockServerCard,
              showValidation: true,
              theme,
            });
            break;

          case "card-view":
            instanceRef.current = MCP.cardView({
              el: containerRef.current,
              serverCard: mockServerCard,
              showValidation: false,
              readOnly: true,
              theme,
            });
            break;
        }

        if (mounted) setIsLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load demo");
          setIsLoading(false);
        }
      }
    };

    loadAndInit();

    // Watch for Docusaurus theme changes
    const observer = new MutationObserver(() => {
      if (instanceRef.current) {
        const theme = getDocusaurusTheme();
        try {
          instanceRef.current.setTheme?.(theme);
        } catch {}
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      mounted = false;
      observer.disconnect();
      if (instanceRef.current) {
        try {
          instanceRef.current.destroy();
        } catch {}
        instanceRef.current = null;
      }
    };
  }, [type, cssUrl, jsUrl]);

  if (error) {
    return (
      <div
        style={{
          height,
          border: "1px solid var(--ifm-color-emphasis-300)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ifm-color-danger)",
          background: "var(--ifm-background-surface-color)",
        }}
      >
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--ifm-background-surface-color)",
            borderRadius: "8px",
            zIndex: 1,
          }}
        >
          Loading demo...
        </div>
      )}
      <div
        ref={containerRef}
        id={`demo-${uniqueId}`}
        style={{
          height,
          width: "100%",
          border: "1px solid var(--ifm-color-emphasis-300)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      />
    </div>
  );
}

export function ComponentDemo({ type, height = "500px" }: ComponentDemoProps) {
  return <ComponentBasedDemo type={type} height={height} />;
}
