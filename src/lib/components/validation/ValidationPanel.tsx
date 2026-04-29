import { useState, useMemo } from "react";
import { useValidationStore } from "@lib/stores/validationStore";
import { ValidationSummary } from "./ValidationSummary";
import { ValidationResultCard } from "./ValidationResultCard";
import Checkmark from "./Checkmark";
import type { ValidationStatus } from "@lib/types/validation";

const sortOrder: Record<ValidationStatus, number> = {
  fail: 0,
  warning: 1,
  pass: 2,
};

export function ValidationPanel() {
  const { results, summary, isValidating, lastValidatedAt } =
    useValidationStore();
  const [activeFilter, setActiveFilter] = useState<ValidationStatus | null>(
    null,
  );

  const allPassed =
    results.length > 0 && summary.fail === 0 && summary.warning === 0;

  const sortedAndFiltered = useMemo(() => {
    const sorted = [...results].sort(
      (a, b) => sortOrder[a.status] - sortOrder[b.status],
    );
    if (!activeFilter) return sorted;
    return sorted.filter((r) => r.status === activeFilter);
  }, [results, activeFilter]);

  // Split "Server card is valid" into main text + version suffix
  const passMessage = "Server card is valid";
  const versionMatch = passMessage.match(/^(.+?)(\s*\(v[\d.]+\))$/); //It will never match as for now, but in results messages there was no matches as well.

  return (
    <div
      data-testid="validation-panel"
      className="flex flex-col gap-4 p-4 h-full"
    >
      {results.length > 0 && (
        <ValidationSummary
          summary={summary}
          isValidating={isValidating}
          lastValidatedAt={lastValidatedAt}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      )}

      {allPassed && !activeFilter ? (
        <div
          data-testid="validation-all-passed"
          className="flex flex-1 flex-col items-center justify-center gap-4"
          style={{ "--c-accent": "#22c55e" } as React.CSSProperties}
        >
          <Checkmark />
          <p className="text-lg">
            <span className="font-bold text-foreground">
              {versionMatch ? versionMatch[1] : passMessage}
            </span>
            {versionMatch && (
              <span className="font-normal text-muted-foreground">
                {versionMatch[2]}
              </span>
            )}
          </p>
        </div>
      ) : sortedAndFiltered.length > 0 ? (
        <div data-testid="validation-results-list" className="space-y-2">
          {sortedAndFiltered.map((result) => (
            <ValidationResultCard key={result.id} result={result} />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="flex items-center justify-center py-8 text-center text-muted-foreground">
          <p className="text-sm">No results match the current filter.</p>
        </div>
      ) : (
        <div
          data-testid="validation-empty-state"
          className="flex items-center justify-center py-8 text-center text-muted-foreground"
        >
          <div>
            <p className="text-lg font-medium">No validation results</p>
            <p className="text-sm">
              Enter a server card JSON and validation will run automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
