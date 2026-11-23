import { useServerCardStore } from "@lib/stores/serverCardStore";
import { useValidationStore } from "@lib/stores/validationStore";
import type { ValidationResult } from "@lib/types/validation";
import { cn } from "@lib/utils/cn";
import { useEffect } from "react";
import type { MCPServerCardDefinition } from "../types/mcp-protocol";
import { ErrorBoundary } from "./ErrorBoundary";
import { EditorLayout } from "./layouts/EditorLayout";
import { ThemeRoot } from "./ThemeRoot";

export interface MCPServerEditorProps {
  initialServerCard?: string;
  initialServerUrl?: string;
  showSettings?: boolean;
  showValidation?: boolean;
  readOnly?: boolean;
  defaultTab?: "overview" | "validation";
  onServerCardChange?: (
    json: string,
    parsed: MCPServerCardDefinition | null,
  ) => void;
  onValidationComplete?: (results: ValidationResult[]) => void;
  className?: string;
}

export function MCPServerEditor({
  initialServerCard,
  initialServerUrl,
  showSettings = true,
  showValidation = true,
  readOnly = false,
  defaultTab = "overview",
  onServerCardChange,
  onValidationComplete,
  className,
}: MCPServerEditorProps) {
  const { setRawJson, loadFromUrl, rawJson, parsedCard } = useServerCardStore();
  const { results } = useValidationStore();

  useEffect(() => {
    if (initialServerCard) {
      setRawJson(initialServerCard);
    } else if (initialServerUrl) {
      loadFromUrl(initialServerUrl);
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: Existing exception retained during tooling migration.
  }, []);

  useEffect(() => {
    onServerCardChange?.(rawJson, parsedCard);
  }, [rawJson, parsedCard, onServerCardChange]);

  useEffect(() => {
    if (results.length > 0) {
      onValidationComplete?.(results);
    }
  }, [results, onValidationComplete]);

  return (
    <ErrorBoundary>
      <ThemeRoot className={cn("h-full", className)}>
        <EditorLayout
          showValidation={showValidation}
          showSettings={showSettings}
          readOnly={readOnly}
          defaultTab={defaultTab}
          className="h-full"
        />
      </ThemeRoot>
    </ErrorBoundary>
  );
}
