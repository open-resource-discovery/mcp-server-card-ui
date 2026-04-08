import { create } from "zustand";
import type { MCPServerCardDefinition } from "../types/mcp-protocol";

interface ServerCardState {
  rawJson: string;
  parsedCard: MCPServerCardDefinition | null;
  lastValidCard: MCPServerCardDefinition | null;
  parseError: string | null;
  isLoading: boolean;
  isDirty: boolean;

  setRawJson: (json: string) => void;
  formatJson: () => void;
  reset: () => void;
  loadFromUrl: (url: string, headers?: Record<string, string>) => Promise<void>;
}

export const useServerCardStore = create<ServerCardState>((set, get) => ({
  rawJson: "",
  parsedCard: null,
  lastValidCard: null,
  parseError: null,
  isLoading: false,
  isDirty: false,

  setRawJson: (json: string) => {
    try {
      const parsed = json.trim() ? (JSON.parse(json) as MCPServerCardDefinition) : null;
      set({
        rawJson: json,
        parsedCard: parsed,
        lastValidCard: parsed ?? get().lastValidCard,
        parseError: null,
        isDirty: true,
      });
    } catch (e) {
      set({
        rawJson: json,
        parsedCard: null,
        parseError: e instanceof Error ? e.message : "Invalid JSON",
        isDirty: true,
      });
    }
  },

  formatJson: () => {
    const { rawJson } = get();
    try {
      const parsed = JSON.parse(rawJson);
      set({ rawJson: JSON.stringify(parsed, null, 2) });
    } catch {
      // Keep current if invalid
    }
  },

  reset: () => {
    set({
      rawJson: "",
      parsedCard: null,
      lastValidCard: null,
      parseError: null,
      isDirty: false,
    });
  },

  loadFromUrl: async (url: string, headers?: Record<string, string>) => {
    set({ isLoading: true });
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
      const json = await response.text();
      get().setRawJson(json);
    } catch (e) {
      set({ parseError: e instanceof Error ? e.message : "Failed to load" });
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Selectors
export const selectParsedCard = (state: ServerCardState) => state.parsedCard;
export const selectParseError = (state: ServerCardState) => state.parseError;
