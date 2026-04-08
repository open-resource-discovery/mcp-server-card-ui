import type { ValidationSummary as ValidationSummaryType, ValidationStatus } from "@lib/types/validation";
import { Badge } from "@lib/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@lib/utils/cn";

interface ValidationSummaryProps {
  summary: ValidationSummaryType;
  isValidating: boolean;
  lastValidatedAt: number | null;
  activeFilter: ValidationStatus | null;
  onFilterChange: (status: ValidationStatus | null) => void;
}

export function ValidationSummary({ summary, isValidating, lastValidatedAt, activeFilter, onFilterChange }: ValidationSummaryProps) {
  const toggle = (status: ValidationStatus) => {
    onFilterChange(activeFilter === status ? null : status);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {isValidating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Validating...</span>
          </>
        ) : (
          <>
            {summary.pass > 0 && (
              <Badge
                variant="success"
                className={cn(
                  "flex items-center gap-1 cursor-pointer transition-opacity",
                  activeFilter && activeFilter !== "pass" && "opacity-40",
                )}
                onClick={() => toggle("pass")}
              >
                <CheckCircle className="h-3 w-3" />
                {summary.pass} passed
              </Badge>
            )}
            {summary.warning > 0 && (
              <Badge
                variant="warning"
                className={cn(
                  "flex items-center gap-1 cursor-pointer transition-opacity",
                  activeFilter && activeFilter !== "warning" && "opacity-40",
                )}
                onClick={() => toggle("warning")}
              >
                <AlertTriangle className="h-3 w-3" />
                {summary.warning} warnings
              </Badge>
            )}
            {summary.fail > 0 && (
              <Badge
                variant="error"
                className={cn(
                  "flex items-center gap-1 cursor-pointer transition-opacity",
                  activeFilter && activeFilter !== "fail" && "opacity-40",
                )}
                onClick={() => toggle("fail")}
              >
                <XCircle className="h-3 w-3" />
                {summary.fail} failed
              </Badge>
            )}
          </>
        )}
      </div>

      {lastValidatedAt && !isValidating && (
        <span className="text-xs text-muted-foreground">Last validated: {new Date(lastValidatedAt).toLocaleTimeString()}</span>
      )}
    </div>
  );
}
