import { useServerCardStore } from "@lib/stores/serverCardStore";
import { useValidationStore } from "@lib/stores/validationStore";
import type { ValidationResult } from "@lib/types/validation";
import { cn } from "@lib/utils/cn";
import { useEffect } from "react";
import type { MCPServerCardDefinition } from "../types/mcp-protocol";
import { CardViewLayout } from "./layouts/CardViewLayout";
import { ThemeRoot } from "./ThemeRoot";

export interface MCPServerCardViewProps {
  initialServerCard?: string;
  initialServerUrl?: string;
  showValidation?: boolean;
  defaultTab?: "overview" | "validation";
  readOnly?: boolean;
  onServerCardChange?: (
    json: string,
    parsed: MCPServerCardDefinition | null,
  ) => void;
  onValidationComplete?: (results: ValidationResult[]) => void;
  className?: string;
}

export function MCPServerCardView({
  initialServerCard,
  initialServerUrl,
  showValidation = true,
  defaultTab = "overview",
  readOnly = false,
  onServerCardChange,
  onValidationComplete,
  className,
}: MCPServerCardViewProps) {
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
    <ThemeRoot className={cn("h-full", className)}>
      <CardViewLayout
        showValidation={showValidation}
        defaultTab={defaultTab}
        readOnly={readOnly}
        className="h-full"
      />
    </ThemeRoot>
  );
}
