import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type {
  FunctionCall,
  ToolCallResult,
  PromptResult,
} from "@lib/types/functions";
import { useMCPConnectionStore } from "./mcpConnectionStore";
import { sendRequest } from "@lib/utils/mcp-transport";
import { isErrorResponse } from "@lib/utils/mcp-jsonrpc";

interface FunctionsState {
  calls: FunctionCall[];
  selectedToolName: string | null;
  selectedPromptName: string | null;
  pendingMode: "tool" | "prompt" | null;
  pendingPrefill: number;

  callTool: (name: string, args: Record<string, unknown>) => Promise<void>;
  getPrompt: (name: string, args: Record<string, unknown>) => Promise<void>;
  readResource: (uri: string) => Promise<void>;
  clearCalls: () => void;
  reset: () => void;
  retryCall: (id: string) => Promise<void>;
  setSelectedToolName: (name: string | null) => void;
  setSelectedPromptName: (name: string | null) => void;
  requestPrefill: () => void;
  clearPendingMode: () => void;
}

export const useFunctionsStore = create<FunctionsState>((set, get) => ({
  calls: [],
  selectedToolName: null,
  selectedPromptName: null,
  pendingMode: null,
  pendingPrefill: 0,

  setSelectedToolName: (name) => set({ selectedToolName: name }),
  setSelectedPromptName: (name) => set({ selectedPromptName: name }),
  requestPrefill: () => set((s) => ({ pendingPrefill: s.pendingPrefill + 1 })),
  clearPendingMode: () => set({ pendingMode: null }),

  callTool: async (name, args) => {
    const callId = uuidv4();
    const call: FunctionCall = {
      id: callId,
      type: "tool",
      name,
      input: args,
      timestamp: Date.now(),
      status: "pending",
    };

    set((state) => ({ calls: [call, ...state.calls] }));

    const config = useMCPConnectionStore.getState().getTransportConfig();
    const startTime = Date.now();

    try {
      const { response } = await sendRequest(
        config,
        "tools/call",
        { name, arguments: args },
        callId,
      );

      if (isErrorResponse(response)) {
        const err = response.error!;
        set((state) => ({
          calls: state.calls.map((c) =>
            c.id === callId
              ? {
                  ...c,
                  status: "error",
                  error: `${err.message} (code: ${err.code})`,
                  durationMs: Date.now() - startTime,
                }
              : c,
          ),
        }));
        return;
      }

      const result = response.result as ToolCallResult;
      set((state) => ({
        calls: state.calls.map((c) =>
          c.id === callId
            ? {
                ...c,
                status: "completed",
                result,
                durationMs: Date.now() - startTime,
              }
            : c,
        ),
      }));
    } catch (err) {
      set((state) => ({
        calls: state.calls.map((c) =>
          c.id === callId
            ? {
                ...c,
                status: "error",
                error: err instanceof Error ? err.message : "Unknown error",
                durationMs: Date.now() - startTime,
              }
            : c,
        ),
      }));
    }
  },

  getPrompt: async (name, args) => {
    const callId = uuidv4();
    const call: FunctionCall = {
      id: callId,
      type: "prompt",
      name,
      input: args,
      timestamp: Date.now(),
      status: "pending",
    };

    set((state) => ({ calls: [call, ...state.calls] }));

    const config = useMCPConnectionStore.getState().getTransportConfig();
    const startTime = Date.now();

    try {
      const { response } = await sendRequest(
        config,
        "prompts/get",
        { name, arguments: args },
        callId,
      );

      if (isErrorResponse(response)) {
        const err = response.error!;
        set((state) => ({
          calls: state.calls.map((c) =>
            c.id === callId
              ? {
                  ...c,
                  status: "error",
                  error: `${err.message} (code: ${err.code})`,
                  durationMs: Date.now() - startTime,
                }
              : c,
          ),
        }));
        return;
      }

      const result = response.result as PromptResult;
      set((state) => ({
        calls: state.calls.map((c) =>
          c.id === callId
            ? {
                ...c,
                status: "completed",
                result,
                durationMs: Date.now() - startTime,
              }
            : c,
        ),
      }));
    } catch (err) {
      set((state) => ({
        calls: state.calls.map((c) =>
          c.id === callId
            ? {
                ...c,
                status: "error",
                error: err instanceof Error ? err.message : "Unknown error",
                durationMs: Date.now() - startTime,
              }
            : c,
        ),
      }));
    }
  },

  readResource: async (uri) => {
    const callId = uuidv4();
    const call: FunctionCall = {
      id: callId,
      type: "tool",
      name: "resources/read",
      input: { uri },
      timestamp: Date.now(),
      status: "pending",
    };

    set((state) => ({ calls: [call, ...state.calls] }));

    const config = useMCPConnectionStore.getState().getTransportConfig();
    const startTime = Date.now();

    try {
      const { response } = await sendRequest(
        config,
        "resources/read",
        { uri },
        callId,
      );

      if (isErrorResponse(response)) {
        const err = response.error!;
        set((state) => ({
          calls: state.calls.map((c) =>
            c.id === callId
              ? {
                  ...c,
                  status: "error",
                  error: `${err.message} (code: ${err.code})`,
                  durationMs: Date.now() - startTime,
                }
              : c,
          ),
        }));
        return;
      }

      const result = response.result as ToolCallResult;
      set((state) => ({
        calls: state.calls.map((c) =>
          c.id === callId
            ? {
                ...c,
                status: "completed",
                result,
                durationMs: Date.now() - startTime,
              }
            : c,
        ),
      }));
    } catch (err) {
      set((state) => ({
        calls: state.calls.map((c) =>
          c.id === callId
            ? {
                ...c,
                status: "error",
                error: err instanceof Error ? err.message : "Unknown error",
                durationMs: Date.now() - startTime,
              }
            : c,
        ),
      }));
    }
  },

  clearCalls: () => set({ calls: [] }),
  reset: () =>
    set({
      calls: [],
      selectedToolName: null,
      selectedPromptName: null,
      pendingMode: null,
      pendingPrefill: 0,
    }),

  retryCall: async (id) => {
    const call = get().calls.find((c) => c.id === id);
    if (!call) return;

    if (call.type === "tool") {
      await get().callTool(call.name, call.input);
    } else {
      await get().getPrompt(call.name, call.input);
    }
  },
}));
