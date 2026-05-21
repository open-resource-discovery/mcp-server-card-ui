import { ValidationEntry } from "@open-resource-discovery/ui-components";
import type { ValidationResult } from "@lib/types/validation";

interface ValidationResultCardProps {
  result: ValidationResult;
}

export function ValidationResultCard({ result }: ValidationResultCardProps) {
  return (
    <ValidationEntry
      data-testid="validation-result-card"
      status={result.status}
      rule={result.rule}
      message={result.message}
      path={result.path}
    />
  );
}
