import { useEffect, useRef, useCallback } from "react";
import Editor, { useMonaco, type OnMount } from "@monaco-editor/react";
import { useTheme } from "@lib/hooks/useTheme";
import type { EditorMarker } from "@lib/types/validation";
import { resolveJsonPathToPosition } from "@lib/utils/json-path-resolver";

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  lineNumbers?: "on" | "off";
  minHeight?: string;
  markers?: EditorMarker[];
}

/**
 * Read a CSS variable from the nearest .mcp-root element and return it as a hex color.
 * Uses a real DOM element inside .mcp-root so the browser resolves oklch/hsl/rgb etc.
 */
function getCssColor(varName: string, fallback: string): string {
  const root = document.querySelector(".mcp-root");
  if (!root) return fallback;

  const raw = getComputedStyle(root).getPropertyValue(varName).trim();
  if (!raw) return fallback;
  // If already hex, return as-is
  if (raw.startsWith("#")) return raw;

  // Create a probe element inside .mcp-root so the browser resolves the color
  const probe = document.createElement("div");
  probe.style.display = "none";
  probe.style.color = `var(${varName})`;
  root.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  root.removeChild(probe);

  // Parse "rgb(r, g, b)" or "color(srgb ...)" → "#rrggbb"
  const rgbMatch = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const hex = (n: string) => parseInt(n).toString(16).padStart(2, "0");
    return `#${hex(rgbMatch[1])}${hex(rgbMatch[2])}${hex(rgbMatch[3])}`;
  }

  // color(srgb r g b) — values are 0-1 floats
  const srgbMatch = computed.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (srgbMatch) {
    const hex = (n: string) => Math.round(parseFloat(n) * 255).toString(16).padStart(2, "0");
    return `#${hex(srgbMatch[1])}${hex(srgbMatch[2])}${hex(srgbMatch[3])}`;
  }

  return fallback;
}

export function MonacoEditor({
  value,
  onChange,
  language = "json",
  readOnly = false,
  lineNumbers = "on",
  minHeight = "300px",
  markers,
}: MonacoEditorProps) {
  const { resolvedTheme } = useTheme();
  const monacoRef = useRef<ReturnType<typeof useMonaco>>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const m = useMonaco();

  useEffect(() => {
    monacoRef.current = m;
  }, [m]);

  const defineThemes = useCallback(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;

    const bg = getCssColor("--background", resolvedTheme === "dark" ? "#1e1e1e" : "#ffffff");
    const fg = getCssColor("--foreground", resolvedTheme === "dark" ? "#d4d4d4" : "#1e1e1e");
    const muted = getCssColor("--muted", resolvedTheme === "dark" ? "#2d2d30" : "#f5f5f5");
    const mutedFg = getCssColor("--muted-foreground", resolvedTheme === "dark" ? "#858585" : "#237893");
    const primary = getCssColor("--primary", resolvedTheme === "dark" ? "#0098ff" : "#005fb8");
    const border = getCssColor("--border", resolvedTheme === "dark" ? "#3e3e42" : "#e0e0e0");

    monaco.editor.defineTheme("app-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": bg,
        "editor.foreground": fg,
        "editorLineNumber.foreground": mutedFg,
        "editorLineNumber.activeForeground": fg,
        "editor.selectionBackground": primary + "44",
        "editor.lineHighlightBackground": muted,
        "editorWidget.background": bg,
        "editorWidget.border": border,
      },
    });

    monaco.editor.defineTheme("app-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": bg,
        "editor.foreground": fg,
        "editorLineNumber.foreground": mutedFg,
        "editorLineNumber.activeForeground": fg,
        "editor.selectionBackground": primary + "33",
        "editor.lineHighlightBackground": muted,
        "editorWidget.background": bg,
        "editorWidget.border": border,
      },
    });

    monaco.editor.setTheme(resolvedTheme === "dark" ? "app-dark" : "app-light");
  }, [resolvedTheme]);

  // Define themes when Monaco loads
  useEffect(() => {
    if (!m) return;
    defineThemes();
  }, [m, defineThemes]);

  // Re-define themes when resolvedTheme changes (or CSS variables change)
  useEffect(() => {
    defineThemes();
  }, [resolvedTheme, defineThemes]);

  // Observe CSS variable changes on .mcp-root (e.g. from the theme editor)
  useEffect(() => {
    const root = document.querySelector(".mcp-root");
    if (!root) return;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "style") {
          defineThemes();
          return;
        }
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, [defineThemes]);

  // Apply validation markers
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    if (!markers || markers.length === 0) {
      monaco.editor.setModelMarkers(model, "mcp-validation", []);
      return;
    }

    const severityMap: Record<string, number> = {
      error: monaco.MarkerSeverity.Error,
      warning: monaco.MarkerSeverity.Warning,
      info: monaco.MarkerSeverity.Info,
      hint: monaco.MarkerSeverity.Hint,
    };

    const monacoMarkers = markers.map((marker) => {
      const pos = resolveJsonPathToPosition(value, marker.path);
      return {
        severity: severityMap[marker.severity] ?? monaco.MarkerSeverity.Error,
        message: marker.message,
        startLineNumber: pos.startLineNumber,
        startColumn: pos.startColumn,
        endLineNumber: pos.endLineNumber,
        endColumn: pos.endColumn,
        source: "MCP Validation",
      };
    });

    monaco.editor.setModelMarkers(model, "mcp-validation", monacoMarkers);

    return () => {
      if (model && !model.isDisposed()) {
        monaco.editor.setModelMarkers(model, "mcp-validation", []);
      }
    };
  }, [m, markers, value]);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    defineThemes();
  };

  return (
    <div style={{ minHeight }} className="h-full w-full">
      <Editor
        value={value}
        onChange={(v) => onChange?.(v || "")}
        language={language}
        theme={resolvedTheme === "dark" ? "app-dark" : "app-light"}
        options={{
          readOnly,
          minimap: { enabled: false },
          automaticLayout: true,
          fontSize: 13,
          lineNumbers,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          renderLineHighlight: "line",
          padding: { top: 8, bottom: 8 },
        }}
        onMount={handleEditorDidMount}
      />
    </div>
  );
}
