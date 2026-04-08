import { useEffect } from "react";
import type { MCPServerCardDefinition } from "@sap/mcp-protocol";
import type { ValidationResult } from "@lib/types/validation";
import type { PredefinedServer } from "@lib/types/connection";
import { useServerCardStore } from "@lib/stores/serverCardStore";
import { useMCPConnectionStore } from "@lib/stores/mcpConnectionStore";
import { useValidationStore } from "@lib/stores/validationStore";
import { MCPPlaygroundLayout } from "./MCPPlaygroundLayout";
import { ThemeRoot } from "./ThemeRoot";
import { ErrorBoundary } from "./ErrorBoundary";
import { cn } from "@lib/utils/cn";

export interface MCPServerPlaygroundProps {
  initialServerCard?: string;
  initialServerUrl?: string;

  showSettings?: boolean;
  showValidation?: boolean;
  showFunctions?: boolean;
  showRawHttp?: boolean;
  showEditor?: boolean;
  readOnly?: boolean;
  defaultTab?: "overview" | "functions" | "rawhttp" | "validation";
  forceDesktop?: boolean;

  predefinedServers?: PredefinedServer[];

  onServerCardChange?: (json: string, parsed: MCPServerCardDefinition | null) => void;
  onConnect?: (url: string) => void;
  onValidationComplete?: (results: ValidationResult[]) => void;

  className?: string;
}

export function MCPServerPlayground({
  initialServerCard,
  initialServerUrl,
  showSettings = true,
  showValidation = true,
  showFunctions = true,
  showRawHttp = true,
  showEditor = true,
  readOnly = false,
  defaultTab = "overview",
  forceDesktop = false,
  onServerCardChange,
  onConnect,
  onValidationComplete,
  className,
}: MCPServerPlaygroundProps) {
  const { setRawJson, loadFromUrl, rawJson, parsedCard } = useServerCardStore();
  const { connectionStatus, url } = useMCPConnectionStore();
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
    if (connectionStatus === "connected" && url) {
      onConnect?.(url);
    }
  }, [connectionStatus, url, onConnect]);

  useEffect(() => {
    if (results.length > 0) {
      onValidationComplete?.(results);
    }
  }, [results, onValidationComplete]);

  return (
    <ErrorBoundary>
      <ThemeRoot className={cn("h-full", className)}>
        <MCPPlaygroundLayout
          showSettings={showSettings}
          showValidation={showValidation}
          showFunctions={showFunctions}
          showRawHttp={showRawHttp}
          showEditor={showEditor}
          readOnly={readOnly}
          defaultTab={defaultTab}
          forceDesktop={forceDesktop}
          className="h-full"
        />
      </ThemeRoot>
    </ErrorBoundary>
  );
}
