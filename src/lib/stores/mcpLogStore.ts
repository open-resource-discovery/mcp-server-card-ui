import { create } from "zustand";
import type { MCPLogEntry } from "@lib/types/mcpLog";

const MAX_LOG_ENTRIES = 50;

interface MCPLogState {
  logs: MCPLogEntry[];
  highlightedLogId: string | null;

  addLog: (entry: MCPLogEntry) => void;
  updateLog: (id: string, updates: Partial<MCPLogEntry>) => void;
  clearLogs: () => void;
  highlightLog: (logId: string | null) => void;
  getLogByFunctionCallId: (functionCallId: string) => MCPLogEntry | undefined;
}

export const useMCPLogStore = create<MCPLogState>((set, get) => ({
  logs: [],
  highlightedLogId: null,

  addLog: (entry) =>
    set((state) => ({
      logs: [entry, ...state.logs].slice(0, MAX_LOG_ENTRIES),
    })),

  updateLog: (id, updates) =>
    set((state) => ({
      logs: state.logs.map((log) =>
        log.id === id ? { ...log, ...updates } : log,
      ),
    })),

  clearLogs: () => set({ logs: [], highlightedLogId: null }),

  highlightLog: (logId) => set({ highlightedLogId: logId }),

  getLogByFunctionCallId: (functionCallId) => {
    return get().logs.find((log) => log.functionCallId === functionCallId);
  },
}));
