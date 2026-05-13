import { useState, useMemo } from "react";
import { useValidationStore } from "@lib/stores/validationStore";
import { ValidationSummary } from "./ValidationSummary";
import { ValidationResultCard } from "./ValidationResultCard";
import Checkmark from "./Checkmark";
import Loader from "./Loader";
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

  const passMessage = "Server card is valid";

  return (
    <div data-testid="validation-panel" className="flex flex-col h-full">
      {results.length > 0 && !allPassed && (
        <div className="flex items-center px-5 py-4 border-b border-border min-h-14">
          <ValidationSummary
            summary={summary}
            isValidating={isValidating}
            lastValidatedAt={lastValidatedAt}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-5 flex flex-col">
        {isValidating ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            <Loader />
            <h2 className="text-xl font-semibold text-foreground">
              Validating
            </h2>
          </div>
        ) : allPassed && !activeFilter ? (
          <div
            data-testid="validation-all-passed"
            className="flex-1 flex flex-col items-center justify-center gap-[29px]"
          >
            <div className="w-20 h-20">
              <Checkmark />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {passMessage}
            </h2>
          </div>
        ) : sortedAndFiltered.length > 0 ? (
          <div data-testid="validation-results-list" className="space-y-3">
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
            className="flex items-center justify-center text-center text-muted-foreground"
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
    </div>
  );
}
