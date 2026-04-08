import { useEffect } from "react";
import type { MCPServerCardDefinition } from "../types/mcp-protocol";
import type { ValidationResult } from "@lib/types/validation";
import { useServerCardStore } from "@lib/stores/serverCardStore";
import { useValidationStore } from "@lib/stores/validationStore";
import { ViewerLayout } from "./layouts/ViewerLayout";
import { ThemeRoot } from "./ThemeRoot";
import { ErrorBoundary } from "./ErrorBoundary";
import { cn } from "@lib/utils/cn";

export interface MCPServerViewerProps {
  initialServerCard?: string;
  initialServerUrl?: string;
  showValidation?: boolean;
  defaultTab?: "overview" | "validation";
  onServerCardChange?: (json: string, parsed: MCPServerCardDefinition | null) => void;
  onValidationComplete?: (results: ValidationResult[]) => void;
  className?: string;
}

export function MCPServerViewer({
  initialServerCard,
  initialServerUrl,
  showValidation = true,
  defaultTab = "overview",
  onServerCardChange,
  onValidationComplete,
  className,
}: MCPServerViewerProps) {
  const { setRawJson, loadFromUrl, rawJson, parsedCard } = useServerCardStore();
  const { results } = useValidationStore();

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
        <ViewerLayout showValidation={showValidation} defaultTab={defaultTab} className="h-full" />
      </ThemeRoot>
    </ErrorBoundary>
  );
}
