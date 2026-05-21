import type {
  ValidationSummary as ValidationSummaryType,
  ValidationStatus,
} from "@lib/types/validation";
import { Badge } from "@lib/components/ui/badge";
import { XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@lib/utils/cn";

interface ValidationSummaryProps {
  summary: ValidationSummaryType;
  isValidating: boolean;
  lastValidatedAt: number | null;
  activeFilter: ValidationStatus | null;
  onFilterChange: (status: ValidationStatus | null) => void;
}

export function ValidationSummary({
  summary,
  activeFilter,
  onFilterChange,
}: ValidationSummaryProps) {
  const toggle = (status: ValidationStatus) => {
    onFilterChange(activeFilter === status ? null : status);
  };

  return (
    <div
      data-testid="validation-summary"
      className="flex items-center justify-between"
    >
      <div className="flex items-center gap-2">
        {summary.warning > 0 && (
          <Badge
            data-testid="validation-badge-warning"
            variant="warning"
            className={cn(
              "flex items-center gap-1 cursor-pointer transition-opacity bg-warning text-white rounded-full",
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
            data-testid="validation-badge-fail"
            variant="destructive"
            className={cn(
              "flex items-center gap-1 cursor-pointer transition-opacity bg-destructive text-white rounded-full",
              activeFilter && activeFilter !== "fail" && "opacity-40",
            )}
            onClick={() => toggle("fail")}
          >
            <XCircle className="h-3 w-3" />
            {summary.fail} failed
          </Badge>
        )}
      </div>
    </div>
  );
}
