import { useState, useCallback, useEffect, useMemo } from "react";
import { useFunctionsStore } from "@lib/stores/functionsStore";
import { useMCPConnectionStore } from "@lib/stores/mcpConnectionStore";
import { useServerCardStore } from "@lib/stores/serverCardStore";
import type { Tool, Prompt } from "../../types/mcp-protocol";
import { Select } from "@lib/components/ui/select";
import { Button } from "@lib/components/ui/button";
import { MonacoEditor } from "@lib/components/editor/MonacoEditor";
import { Play, Loader2 } from "lucide-react";

/**
 * Generate a sample JSON object from a tool's inputSchema.
 * Uses defaults when available, otherwise picks a sensible placeholder
 * based on the property type.
 */
function generateToolInput(tool: Tool): string {
  const schema = tool.inputSchema as
    | {
        properties?: Record<
          string,
          { type?: string; default?: unknown; enum?: unknown[] }
        >;
        required?: string[];
      }
    | undefined;
  if (!schema?.properties) return "{}";

  const obj: Record<string, unknown> = {};
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (prop.default !== undefined) {
      obj[key] = prop.default;
    } else if (prop.enum && prop.enum.length > 0) {
      obj[key] = prop.enum[0];
    } else {
      switch (prop.type) {
        case "number":
        case "integer":
          obj[key] = 0;
          break;
        case "boolean":
          obj[key] = false;
          break;
        case "array":
          obj[key] = [];
          break;
        case "object":
          obj[key] = {};
          break;
        default:
          obj[key] = "";
      }
    }
  }
  return JSON.stringify(obj, null, 2);
}

/**
 * Generate a sample JSON object from a prompt's arguments definition.
 */
function generatePromptInput(prompt: Prompt): string {
  if (!prompt.arguments || prompt.arguments.length === 0) return "{}";
  const obj: Record<string, string> = {};
  for (const arg of prompt.arguments) {
    obj[arg.name] = "";
  }
  return JSON.stringify(obj, null, 2);
}

export function FunctionInput() {
  const {
    callTool,
    getPrompt,
    selectedToolName,
    selectedPromptName,
    pendingPrefill,
    setSelectedToolName,
    setSelectedPromptName,
  } = useFunctionsStore();
  const connectionStatus = useMCPConnectionStore((s) => s.connectionStatus);
  const parsedCard = useServerCardStore((s) => s.parsedCard);
  const lastValidCard = useServerCardStore((s) => s.lastValidCard);
  const card = parsedCard ?? lastValidCard;

  const [mode, setMode] = useState<"tool" | "prompt">("tool");
  const [inputJson, setInputJson] = useState("{}");
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tools = useMemo(() => card?.tools ?? [], [card?.tools]);
  const prompts = useMemo(() => card?.prompts ?? [], [card?.prompts]);
  const isConnected = connectionStatus === "connected";

  // Pre-fill input when "Try it" is clicked or selected tool/prompt changes
  useEffect(() => {
    if (selectedToolName) {
      setMode("tool");
      const tool = tools.find((t) => t.name === selectedToolName);
      if (tool) {
        setInputJson(generateToolInput(tool));
        setError(null);
      }
    } else if (selectedPromptName) {
      setMode("prompt");
      const prompt = prompts.find((p) => p.name === selectedPromptName);
      if (prompt) {
        setInputJson(generatePromptInput(prompt));
        setError(null);
      }
    } else {
      setInputJson("{}");
    }
  }, [pendingPrefill, selectedToolName, selectedPromptName, tools, prompts]);

  const selectedName = mode === "tool" ? selectedToolName : selectedPromptName;

  const handleSelectName = useCallback(
    (name: string) => {
      if (mode === "tool") {
        setSelectedToolName(name);
        const tool = tools.find((t) => t.name === name);
        setInputJson(tool ? generateToolInput(tool) : "{}");
      } else {
        setSelectedPromptName(name);
        const prompt = prompts.find((p) => p.name === name);
        setInputJson(prompt ? generatePromptInput(prompt) : "{}");
      }
      setError(null);
    },
    [mode, tools, prompts, setSelectedToolName, setSelectedPromptName],
  );

  const handleExecute = useCallback(async () => {
    if (!selectedName) return;

    let parsedInput: Record<string, unknown>;
    try {
      parsedInput = JSON.parse(inputJson);
    } catch {
      setError("Invalid JSON input");
      return;
    }

    setError(null);
    setIsExecuting(true);

    try {
      if (mode === "tool") {
        await callTool(selectedName, parsedInput);
      } else {
        await getPrompt(selectedName, parsedInput);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Execution failed");
    } finally {
      setIsExecuting(false);
    }
  }, [selectedName, inputJson, mode, callTool, getPrompt]);

  return (
    <div className="border-t p-4 space-y-3">
      <div className="flex gap-2">
        <Select.Root
          value={mode}
          onValueChange={(v) => setMode(v as "tool" | "prompt")}
        >
          <Select.Trigger className="h-8 w-24 text-xs">
            <Select.Value />
            <Select.Icon />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="tool">
                  <Select.ItemIndicator />
                  <Select.ItemText>Tool</Select.ItemText>
                </Select.Item>
                <Select.Item value="prompt">
                  <Select.ItemIndicator />
                  <Select.ItemText>Prompt</Select.ItemText>
                </Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>

        <Select.Root
          value={selectedName ?? ""}
          onValueChange={(v) => typeof v === "string" && handleSelectName(v)}
        >
          <Select.Trigger className="h-8 flex-1 text-xs">
            <Select.Value placeholder={`Select ${mode}...`}>
              {selectedName
                ? mode === "tool"
                  ? tools.find((t) => t.name === selectedName)?.title ||
                    selectedName
                  : prompts.find((p) => p.name === selectedName)?.title ||
                    selectedName
                : undefined}
            </Select.Value>
            <Select.Icon />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                {mode === "tool"
                  ? tools.map((t) => (
                      <Select.Item
                        key={t.name}
                        value={t.name}
                        label={t.title || t.name}
                      >
                        <Select.ItemIndicator />
                        <Select.ItemText>{t.title || t.name}</Select.ItemText>
                      </Select.Item>
                    ))
                  : prompts.map((p) => (
                      <Select.Item
                        key={p.name}
                        value={p.name}
                        label={p.title || p.name}
                      >
                        <Select.ItemIndicator />
                        <Select.ItemText>{p.title || p.name}</Select.ItemText>
                      </Select.Item>
                    ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>

      <div className="h-32 rounded border overflow-hidden">
        <MonacoEditor
          value={inputJson}
          onChange={setInputJson}
          language="json"
          lineNumbers="off"
          minHeight="128px"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button
        size="sm"
        onClick={handleExecute}
        disabled={!isConnected || !selectedName || isExecuting}
        className="w-full"
        data-testid="execute-button"
      >
        {isExecuting ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Play className="h-4 w-4 mr-1" />
        )}
        {isExecuting ? "Executing..." : "Execute"}
      </Button>

      {!isConnected && (
        <p className="text-xs text-muted-foreground text-center">
          Connect to a server to execute functions
        </p>
      )}
    </div>
  );
}
