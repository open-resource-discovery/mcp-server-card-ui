import React, { useEffect, useRef, useState, useCallback } from "react";
import Layout from "@theme/Layout";
import useBaseUrl from "@docusaurus/useBaseUrl";
import Head from "@docusaurus/Head";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface VarDef {
  name: string;
  label: string;
  type: "color" | "range";
  min?: number;
  max?: number;
  step?: number;
}

interface Section {
  title: string;
  vars: VarDef[];
}

const SECTIONS: Section[] = [
  {
    title: "Core Colors",
    vars: [
      { name: "--background", label: "Background", type: "color" },
      { name: "--foreground", label: "Foreground", type: "color" },
    ],
  },
  {
    title: "Brand",
    vars: [
      { name: "--primary", label: "Primary", type: "color" },
      {
        name: "--primary-foreground",
        label: "Primary Foreground",
        type: "color",
      },
    ],
  },
  {
    title: "Surfaces",
    vars: [
      { name: "--card", label: "Card", type: "color" },
      { name: "--card-foreground", label: "Card Foreground", type: "color" },
      { name: "--popover", label: "Popover", type: "color" },
      {
        name: "--popover-foreground",
        label: "Popover Foreground",
        type: "color",
      },
    ],
  },
  {
    title: "UI Colors",
    vars: [
      { name: "--secondary", label: "Secondary", type: "color" },
      {
        name: "--secondary-foreground",
        label: "Secondary Foreground",
        type: "color",
      },
      { name: "--muted", label: "Muted", type: "color" },
      { name: "--muted-foreground", label: "Muted Foreground", type: "color" },
      { name: "--accent", label: "Accent", type: "color" },
      {
        name: "--accent-foreground",
        label: "Accent Foreground",
        type: "color",
      },
    ],
  },
  {
    title: "Semantic",
    vars: [{ name: "--destructive", label: "Destructive", type: "color" }],
  },
  {
    title: "Borders & Inputs",
    vars: [
      { name: "--border", label: "Border", type: "color" },
      { name: "--input", label: "Input Border", type: "color" },
      { name: "--ring", label: "Focus Ring", type: "color" },
    ],
  },
  {
    title: "Border Radius",
    vars: [
      {
        name: "--radius",
        label: "Radius",
        type: "range",
        min: 0,
        max: 20,
        step: 1,
      },
    ],
  },
  {
    title: "Sidebar",
    vars: [
      { name: "--sidebar", label: "Background", type: "color" },
      { name: "--sidebar-foreground", label: "Foreground", type: "color" },
      { name: "--sidebar-primary", label: "Primary", type: "color" },
      {
        name: "--sidebar-primary-foreground",
        label: "Primary FG",
        type: "color",
      },
      { name: "--sidebar-accent", label: "Accent", type: "color" },
      {
        name: "--sidebar-accent-foreground",
        label: "Accent FG",
        type: "color",
      },
      { name: "--sidebar-border", label: "Border", type: "color" },
      { name: "--sidebar-ring", label: "Ring", type: "color" },
    ],
  },
  {
    title: "Syntax Highlighting",
    vars: [
      { name: "--hljs-attr", label: "Attribute", type: "color" },
      { name: "--hljs-string", label: "String", type: "color" },
      { name: "--hljs-number", label: "Number", type: "color" },
      { name: "--hljs-literal", label: "Literal", type: "color" },
      { name: "--hljs-punctuation", label: "Punctuation", type: "color" },
      { name: "--hljs-keyword", label: "Keyword", type: "color" },
      { name: "--hljs-comment", label: "Comment", type: "color" },
    ],
  },
];

// All variable names for iteration
const ALL_VARS = SECTIONS.flatMap((s) => s.vars.map((v) => v.name));

// ---------------------------------------------------------------------------
// Preset themes (dark-mode hex values)
// ---------------------------------------------------------------------------

interface Preset {
  label: string;
  mode: "dark" | "light";
  values: Record<string, string>;
}

const PRESETS: Preset[] = [
  {
    label: "Default Dark",
    mode: "dark",
    values: {
      "--background": "#1e1e1e",
      "--foreground": "#d4d4d4",
      "--card": "#252526",
      "--card-foreground": "#d4d4d4",
      "--popover": "#252526",
      "--popover-foreground": "#d4d4d4",
      "--primary": "#0098ff",
      "--primary-foreground": "#1e1e1e",
      "--secondary": "#2d2d30",
      "--secondary-foreground": "#d4d4d4",
      "--muted": "#2d2d30",
      "--muted-foreground": "#969696",
      "--accent": "#2d2d30",
      "--accent-foreground": "#d4d4d4",
      "--destructive": "#f44747",
      "--border": "#3e3e42",
      "--input": "#3e3e42",
      "--ring": "#0098ff",
      "--sidebar": "#252526",
      "--sidebar-foreground": "#d4d4d4",
      "--sidebar-primary": "#0098ff",
      "--sidebar-primary-foreground": "#d4d4d4",
      "--sidebar-accent": "#2d2d30",
      "--sidebar-accent-foreground": "#d4d4d4",
      "--sidebar-border": "#3e3e42",
      "--sidebar-ring": "#0098ff",
      "--radius": "10",
      "--hljs-attr": "#9cdcfe",
      "--hljs-string": "#ce9178",
      "--hljs-number": "#b5cea8",
      "--hljs-literal": "#569cd6",
      "--hljs-punctuation": "#d4d4d4",
      "--hljs-keyword": "#569cd6",
      "--hljs-comment": "#6a9955",
    },
  },
  {
    label: "Default Light",
    mode: "light",
    values: {
      "--background": "#ffffff",
      "--foreground": "#1a1a2e",
      "--card": "#ffffff",
      "--card-foreground": "#1a1a2e",
      "--popover": "#ffffff",
      "--popover-foreground": "#1a1a2e",
      "--primary": "#1a1a2e",
      "--primary-foreground": "#fafafa",
      "--secondary": "#f4f4f5",
      "--secondary-foreground": "#1a1a2e",
      "--muted": "#f4f4f5",
      "--muted-foreground": "#71717a",
      "--accent": "#f4f4f5",
      "--accent-foreground": "#1a1a2e",
      "--destructive": "#dc2626",
      "--border": "#e4e4e7",
      "--input": "#e4e4e7",
      "--ring": "#a1a1aa",
      "--sidebar": "#fafafa",
      "--sidebar-foreground": "#1a1a2e",
      "--sidebar-primary": "#1a1a2e",
      "--sidebar-primary-foreground": "#fafafa",
      "--sidebar-accent": "#f4f4f5",
      "--sidebar-accent-foreground": "#1a1a2e",
      "--sidebar-border": "#e4e4e7",
      "--sidebar-ring": "#a1a1aa",
      "--radius": "10",
      "--hljs-attr": "#881391",
      "--hljs-string": "#a31515",
      "--hljs-number": "#098658",
      "--hljs-literal": "#0000ff",
      "--hljs-punctuation": "#000000",
      "--hljs-keyword": "#0000ff",
      "--hljs-comment": "#008000",
    },
  },
  {
    label: "Ocean",
    mode: "dark",
    values: {
      "--background": "#0b1929",
      "--foreground": "#b2ccd6",
      "--card": "#0d2137",
      "--card-foreground": "#b2ccd6",
      "--popover": "#0d2137",
      "--popover-foreground": "#b2ccd6",
      "--primary": "#00bcd4",
      "--primary-foreground": "#0b1929",
      "--secondary": "#132f4c",
      "--secondary-foreground": "#b2ccd6",
      "--muted": "#132f4c",
      "--muted-foreground": "#6b8a9e",
      "--accent": "#132f4c",
      "--accent-foreground": "#b2ccd6",
      "--destructive": "#ff6b6b",
      "--border": "#1e3a5f",
      "--input": "#1e3a5f",
      "--ring": "#00bcd4",
      "--sidebar": "#0d2137",
      "--sidebar-foreground": "#b2ccd6",
      "--sidebar-primary": "#00bcd4",
      "--sidebar-primary-foreground": "#b2ccd6",
      "--sidebar-accent": "#132f4c",
      "--sidebar-accent-foreground": "#b2ccd6",
      "--sidebar-border": "#1e3a5f",
      "--sidebar-ring": "#00bcd4",
      "--radius": "8",
      "--hljs-attr": "#80cbc4",
      "--hljs-string": "#c3e88d",
      "--hljs-number": "#f78c6c",
      "--hljs-literal": "#89ddff",
      "--hljs-punctuation": "#b2ccd6",
      "--hljs-keyword": "#c792ea",
      "--hljs-comment": "#546e7a",
    },
  },
  {
    label: "Forest",
    mode: "dark",
    values: {
      "--background": "#1a2e1a",
      "--foreground": "#c8d6c0",
      "--card": "#223322",
      "--card-foreground": "#c8d6c0",
      "--popover": "#223322",
      "--popover-foreground": "#c8d6c0",
      "--primary": "#4caf50",
      "--primary-foreground": "#1a2e1a",
      "--secondary": "#2d4a2d",
      "--secondary-foreground": "#c8d6c0",
      "--muted": "#2d4a2d",
      "--muted-foreground": "#7fa07a",
      "--accent": "#2d4a2d",
      "--accent-foreground": "#c8d6c0",
      "--destructive": "#e57373",
      "--border": "#3d5c3d",
      "--input": "#3d5c3d",
      "--ring": "#4caf50",
      "--sidebar": "#223322",
      "--sidebar-foreground": "#c8d6c0",
      "--sidebar-primary": "#4caf50",
      "--sidebar-primary-foreground": "#c8d6c0",
      "--sidebar-accent": "#2d4a2d",
      "--sidebar-accent-foreground": "#c8d6c0",
      "--sidebar-border": "#3d5c3d",
      "--sidebar-ring": "#4caf50",
      "--radius": "12",
      "--hljs-attr": "#a5d6a7",
      "--hljs-string": "#ffe082",
      "--hljs-number": "#ffcc80",
      "--hljs-literal": "#81c784",
      "--hljs-punctuation": "#c8d6c0",
      "--hljs-keyword": "#aed581",
      "--hljs-comment": "#6b8e6b",
    },
  },
  {
    label: "Rose",
    mode: "dark",
    values: {
      "--background": "#1c1017",
      "--foreground": "#e8d5dc",
      "--card": "#271520",
      "--card-foreground": "#e8d5dc",
      "--popover": "#271520",
      "--popover-foreground": "#e8d5dc",
      "--primary": "#f472b6",
      "--primary-foreground": "#1c1017",
      "--secondary": "#3d1f30",
      "--secondary-foreground": "#e8d5dc",
      "--muted": "#3d1f30",
      "--muted-foreground": "#a07888",
      "--accent": "#3d1f30",
      "--accent-foreground": "#e8d5dc",
      "--destructive": "#fb7185",
      "--border": "#4d2a3c",
      "--input": "#4d2a3c",
      "--ring": "#f472b6",
      "--sidebar": "#271520",
      "--sidebar-foreground": "#e8d5dc",
      "--sidebar-primary": "#f472b6",
      "--sidebar-primary-foreground": "#e8d5dc",
      "--sidebar-accent": "#3d1f30",
      "--sidebar-accent-foreground": "#e8d5dc",
      "--sidebar-border": "#4d2a3c",
      "--sidebar-ring": "#f472b6",
      "--radius": "14",
      "--hljs-attr": "#fda4af",
      "--hljs-string": "#fcd34d",
      "--hljs-number": "#fdba74",
      "--hljs-literal": "#f9a8d4",
      "--hljs-punctuation": "#e8d5dc",
      "--hljs-keyword": "#c4b5fd",
      "--hljs-comment": "#7a5568",
    },
  },
  {
    label: "Monochrome",
    mode: "dark",
    values: {
      "--background": "#171717",
      "--foreground": "#d4d4d4",
      "--card": "#212121",
      "--card-foreground": "#d4d4d4",
      "--popover": "#212121",
      "--popover-foreground": "#d4d4d4",
      "--primary": "#e0e0e0",
      "--primary-foreground": "#171717",
      "--secondary": "#2a2a2a",
      "--secondary-foreground": "#d4d4d4",
      "--muted": "#2a2a2a",
      "--muted-foreground": "#808080",
      "--accent": "#2a2a2a",
      "--accent-foreground": "#d4d4d4",
      "--destructive": "#d4d4d4",
      "--border": "#404040",
      "--input": "#404040",
      "--ring": "#a0a0a0",
      "--sidebar": "#212121",
      "--sidebar-foreground": "#d4d4d4",
      "--sidebar-primary": "#e0e0e0",
      "--sidebar-primary-foreground": "#d4d4d4",
      "--sidebar-accent": "#2a2a2a",
      "--sidebar-accent-foreground": "#d4d4d4",
      "--sidebar-border": "#404040",
      "--sidebar-ring": "#a0a0a0",
      "--radius": "6",
      "--hljs-attr": "#b0b0b0",
      "--hljs-string": "#a0a0a0",
      "--hljs-number": "#c0c0c0",
      "--hljs-literal": "#d0d0d0",
      "--hljs-punctuation": "#909090",
      "--hljs-keyword": "#e0e0e0",
      "--hljs-comment": "#606060",
    },
  },
];

// Sample server card
const SAMPLE_SERVER_CARD = JSON.stringify(
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
      { type: "streamable-http", url: "https://api.weather.example.com/mcp" },
    ],
    capabilities: {
      tools: { listChanged: false },
      resources: { subscribe: false, listChanged: false },
    },
    authentication: { required: true, schemas: ["bearer", "oauth2"] },
    instructions:
      "Use get_weather for current conditions and get_forecast for multi-day forecasts.",
    tools: [
      {
        name: "get_weather",
        title: "Get Current Weather",
        description: "Returns current weather conditions for a city.",
        annotations: { readOnlyHint: true, openWorldHint: true },
        inputSchema: {
          type: "object",
          properties: { city: { type: "string", description: "City name" } },
          required: ["city"],
        },
      },
      {
        name: "get_forecast",
        title: "Get Weather Forecast",
        description: "Returns a multi-day weather forecast.",
        annotations: { readOnlyHint: true },
        inputSchema: {
          type: "object",
          properties: {
            city: { type: "string", description: "City name" },
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
          { name: "city", description: "City name", required: true },
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function oklchToHex(value: string): string {
  // For oklch values, try to resolve via a temporary element
  if (value.startsWith("oklch(")) {
    try {
      const el = document.createElement("div");
      el.style.color = value;
      document.body.appendChild(el);
      const computed = getComputedStyle(el).color;
      document.body.removeChild(el);
      // computed is like "rgb(r, g, b)"
      const match = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [, r, g, b] = match;
        return `#${[r, g, b].map((c) => Number(c).toString(16).padStart(2, "0")).join("")}`;
      }
    } catch {}
  }
  // Already hex
  if (value.startsWith("#"))
    return value.length === 4
      ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
      : value;
  return value;
}

function getResolvedVar(element: HTMLElement, varName: string): string {
  const computed = getComputedStyle(element).getPropertyValue(varName).trim();
  if (!computed) return "#000000";
  return oklchToHex(computed);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ColorControl({
  def,
  value,
  onChange,
}: {
  def: VarDef;
  value: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div className="te-control">
      <label className="te-label">{def.label}</label>
      <div className="te-color-row">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(def.name, e.target.value)}
          className="te-color-input"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(def.name, v);
          }}
          className="te-hex-input"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function RangeControl({
  def,
  value,
  onChange,
}: {
  def: VarDef;
  value: string;
  onChange: (name: string, value: string) => void;
}) {
  const numVal = parseInt(value, 10) || 0;
  return (
    <div className="te-control">
      <label className="te-label">
        {def.label}: {numVal}px
      </label>
      <input
        type="range"
        min={def.min ?? 0}
        max={def.max ?? 20}
        step={def.step ?? 1}
        value={numVal}
        onChange={(e) => onChange(def.name, e.target.value)}
        className="te-range-input"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ThemeEditorPage(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [isDark, setIsDark] = useState(true);
  const [activePreset, setActivePreset] = useState("Default Dark");
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);

  const cssUrl = useBaseUrl("/standalone/mcp-playground.css");
  const jsUrl = useBaseUrl("/standalone/mcp-playground.js");

  // Load standalone bundle & init playground
  useEffect(() => {
    let mounted = true;

    const loadAndInit = async () => {
      try {
        if (!document.querySelector(`link[href="${cssUrl}"]`)) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = cssUrl;
          document.head.appendChild(link);
        }

        if (!(window as any).MCPPlayground) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector(`script[src="${jsUrl}"]`);
            if (existing) {
              const iv = setInterval(() => {
                if ((window as any).MCPPlayground) {
                  clearInterval(iv);
                  resolve();
                }
              }, 50);
              setTimeout(() => {
                clearInterval(iv);
                reject(new Error("Timeout"));
              }, 10000);
              return;
            }
            const s = document.createElement("script");
            s.src = jsUrl;
            s.onload = () => setTimeout(resolve, 100);
            s.onerror = () => reject(new Error("Script load failed"));
            document.body.appendChild(s);
          });
        }

        if (!mounted || !containerRef.current) return;

        instanceRef.current = (window as any).MCPPlayground.init({
          el: containerRef.current,
          serverCard: SAMPLE_SERVER_CARD,
          showSettings: true,
          showEditor: true,
          showFunctions: true,
          showRawHttp: true,
          theme: "dark",
        });

        // Read initial computed values
        if (containerRef.current) {
          const initial: Record<string, string> = {};
          const mcpRoot = containerRef.current.querySelector(
            ".mcp-root",
          ) as HTMLElement | null;
          const target = mcpRoot ?? containerRef.current;
          for (const name of ALL_VARS) {
            if (name === "--radius") {
              initial[name] = "10";
            } else {
              initial[name] = getResolvedVar(target, name);
            }
          }
          setOverrides(initial);
        }

        if (mounted) setIsLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load");
          setIsLoading(false);
        }
      }
    };

    loadAndInit();

    return () => {
      mounted = false;
      if (instanceRef.current) {
        try {
          instanceRef.current.destroy();
        } catch {}
        instanceRef.current = null;
      }
    };
  }, [cssUrl, jsUrl]);

  // Apply overrides to the mcp-root element whenever they change
  useEffect(() => {
    if (!containerRef.current) return;
    const mcpRoot = containerRef.current.querySelector(
      ".mcp-root",
    ) as HTMLElement | null;
    const target = mcpRoot ?? containerRef.current;

    for (const [name, value] of Object.entries(overrides)) {
      if (name === "--radius") {
        target.style.setProperty(name, `${value}px`);
      } else {
        target.style.setProperty(name, value);
      }
    }
  }, [overrides]);

  const handleChange = useCallback((name: string, value: string) => {
    setOverrides((prev) => ({ ...prev, [name]: value }));
    setActivePreset("");
  }, []);

  const applyPreset = useCallback((presetLabel: string) => {
    const preset = PRESETS.find((p) => p.label === presetLabel);
    if (!preset) return;
    setActivePreset(presetLabel);
    setOverrides(preset.values);

    // Toggle dark/light
    const wantDark = preset.mode === "dark";
    setIsDark(wantDark);
    if (instanceRef.current) {
      try {
        instanceRef.current.setTheme(wantDark ? "dark" : "light");
      } catch {}
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    if (instanceRef.current) {
      try {
        instanceRef.current.setTheme(next ? "dark" : "light");
      } catch {}
    }
    // Re-read computed vars after theme toggle
    setTimeout(() => {
      if (!containerRef.current) return;
      const mcpRoot = containerRef.current.querySelector(
        ".mcp-root",
      ) as HTMLElement | null;
      const target = mcpRoot ?? containerRef.current;
      // First clear inline overrides so we can read the new theme's values
      for (const name of ALL_VARS) {
        target.style.removeProperty(name);
      }
      const fresh: Record<string, string> = {};
      for (const name of ALL_VARS) {
        if (name === "--radius") {
          fresh[name] = "10";
        } else {
          fresh[name] = getResolvedVar(target, name);
        }
      }
      setOverrides(fresh);
      setActivePreset(next ? "Default Dark" : "Default Light");
    }, 100);
  }, [isDark]);

  const resetAll = useCallback(() => {
    if (!containerRef.current) return;
    const mcpRoot = containerRef.current.querySelector(
      ".mcp-root",
    ) as HTMLElement | null;
    const target = mcpRoot ?? containerRef.current;
    for (const name of ALL_VARS) {
      target.style.removeProperty(name);
    }
    // Re-read defaults
    const fresh: Record<string, string> = {};
    for (const name of ALL_VARS) {
      if (name === "--radius") {
        fresh[name] = "10";
      } else {
        fresh[name] = getResolvedVar(target, name);
      }
    }
    setOverrides(fresh);
    setActivePreset(isDark ? "Default Dark" : "Default Light");
  }, [isDark]);

  const exportCss = useCallback(() => {
    const selector = isDark ? ".mcp-root.dark" : ".mcp-root";
    const lines = Object.entries(overrides)
      .map(([name, value]) => {
        if (name === "--radius") return `  ${name}: ${value}px;`;
        return `  ${name}: ${value};`;
      })
      .join("\n");
    return `${selector} {\n${lines}\n}`;
  }, [overrides, isDark]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(exportCss()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [exportCss]);

  return (
    <Layout
      title="Theme Editor"
      description="Live theme customization for MCP Server Card UI components"
    >
      <Head>
        <style>{`
          .playground-page ~ footer,
          .playground-page ~ .VPFooter { display: none; }
        `}</style>
      </Head>
      <div className="te-layout">
        {/* Controls sidebar */}
        <div className="te-sidebar">
          <div className="te-sidebar-header">
            <h2 className="te-title">Theme Editor</h2>
            <p className="te-subtitle">
              Customize CSS variables and see changes live
            </p>
          </div>

          {/* Actions */}
          <div className="te-actions">
            <select
              value={activePreset}
              onChange={(e) => applyPreset(e.target.value)}
              className="te-select"
            >
              <option value="" disabled>
                Select preset...
              </option>
              {PRESETS.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>

            <div className="te-btn-row">
              <button
                onClick={toggleTheme}
                className="te-btn"
                title="Toggle light/dark"
              >
                {isDark ? "Light" : "Dark"}
              </button>
              <button onClick={resetAll} className="te-btn">
                Reset
              </button>
              <button
                onClick={() => setShowExport(!showExport)}
                className="te-btn te-btn-primary"
              >
                Export CSS
              </button>
            </div>
          </div>

          {/* Export modal */}
          {showExport && (
            <div className="te-export">
              <div className="te-export-header">
                <span className="te-export-title">Generated CSS</span>
                <button onClick={handleCopy} className="te-btn te-btn-sm">
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <textarea
                className="te-export-code"
                readOnly
                value={exportCss()}
                rows={12}
              />
            </div>
          )}

          {/* Variable sections */}
          <div className="te-sections">
            {SECTIONS.map((section) => (
              <details key={section.title} open>
                <summary className="te-section-title">{section.title}</summary>
                <div className="te-section-body">
                  {section.vars.map((def) =>
                    def.type === "color" ? (
                      <ColorControl
                        key={def.name}
                        def={def}
                        value={overrides[def.name] || "#000000"}
                        onChange={handleChange}
                      />
                    ) : (
                      <RangeControl
                        key={def.name}
                        def={def}
                        value={overrides[def.name] || "10"}
                        onChange={handleChange}
                      />
                    ),
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Playground preview */}
        <div className="te-preview">
          {isLoading && <div className="te-loading">Loading playground...</div>}
          {error && <div className="te-error">Error: {error}</div>}
          <div ref={containerRef} className="te-container" />
        </div>
      </div>
    </Layout>
  );
}
