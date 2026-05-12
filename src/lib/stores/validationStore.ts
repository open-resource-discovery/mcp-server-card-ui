import { create } from "zustand";
import type {
  ValidationResult,
  ValidationSummary,
} from "@lib/types/validation";
import { validateMCPServerCardSchema } from "@lib/utils/mcp-schema";

interface ValidationState {
  results: ValidationResult[];
  summary: ValidationSummary;
  isValidating: boolean;
  lastValidatedAt: number | null;

  validate: (rawJson: string) => Promise<void>;
  clear: () => void;
}

const emptySummary: ValidationSummary = {
  total: 0,
  pass: 0,
  fail: 0,
  warning: 0,
};

function computeSummary(results: ValidationResult[]): ValidationSummary {
  return results.reduce(
    (acc, r) => {
      acc.total++;
      if (r.status === "pass") acc.pass++;
      else if (r.status === "fail") acc.fail++;
      else if (r.status === "warning") acc.warning++;
      return acc;
    },
    { total: 0, pass: 0, fail: 0, warning: 0 },
  );
}

export const useValidationStore = create<ValidationState>((set) => ({
  results: [],
  summary: emptySummary,
  isValidating: false,
  lastValidatedAt: null,

  validate: async (rawJson: string) => {
    set({ isValidating: true });
    try {
      const results = validateMCPServerCardSchema(rawJson);
      const summary = computeSummary(results);
      set({
        results,
        summary,
        isValidating: false,
        lastValidatedAt: Date.now(),
      });
    } catch {
      set({ isValidating: false });
    }
  },

  clear: () => {
    set({ results: [], summary: emptySummary, lastValidatedAt: null });
  },
}));

export const selectValidationSummary = (state: ValidationState) =>
  state.summary;
