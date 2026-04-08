import { useEffect } from "react";
import type { MCPServerCardDefinition } from "@sap/mcp-protocol";
import type { ValidationResult } from "@lib/types/validation";
import { useServerCardStore } from "@lib/stores/serverCardStore";
import { useValidationStore } from "@lib/stores/validationStore";
import { useAutoValidate } from "@lib/hooks/useAutoValidate";
import { EditorLayout } from "./layouts/EditorLayout";
import { ThemeRoot } from "./ThemeRoot";
import { ErrorBoundary } from "./ErrorBoundary";
import { cn } from "@lib/utils/cn";

export interface MCPServerPlaygroundLiteProps {
  initialServerCard?: string;
  initialServerUrl?: string;
  showValidation?: boolean;
  readOnly?: boolean;
  defaultTab?: "overview" | "validation";

  onServerCardChange?: (json: string, parsed: MCPServerCardDefinition | null) => void;
  onValidationComplete?: (results: ValidationResult[]) => void;

  className?: string;
}

export function MCPServerPlaygroundLite({
  initialServerCard,
  initialServerUrl,
  showValidation = true,
  readOnly = false,
  defaultTab = "overview",
  onServerCardChange,
  onValidationComplete,
  className,
}: MCPServerPlaygroundLiteProps) {
  const { setRawJson, loadFromUrl, rawJson, parsedCard } = useServerCardStore();
  const { results } = useValidationStore();

  useAutoValidate();

  useEffect(() => {
    if (initialServerCard) {
      setRawJson(initialServerCard);
    } else if (initialServerUrl) {
      loadFromUrl(initialServerUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          readOnly={readOnly}
          defaultTab={defaultTab}
          className="h-full"
        />
      </ThemeRoot>
    </ErrorBoundary>
  );
}
