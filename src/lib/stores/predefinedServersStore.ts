import { create } from "zustand";
import type { PredefinedServer } from "@lib/types/connection";
import { getStoredJsonResult, setStoredJson } from "@lib/utils/local-storage";
import {
  getConfigServers,
  getConfigOrdUrl,
} from "@lib/utils/playground-config";
import {
  discoverServersFromOrd,
  formatOrdDiscoveryIssue,
} from "@lib/utils/ord-discovery";
import {
  formatPredefinedServerIssue,
  validatePredefinedServers,
} from "@lib/utils/predefined-server-validation";

const CUSTOM_SERVERS_STORAGE_KEY = "mcp-custom-servers";

export interface ServerLoadNotice {
  severity: "warning" | "error";
  summary: string;
  details: string[];
}

interface PredefinedServersState {
  servers: PredefinedServer[];
  selectedId: string | null;
  loading: boolean;
  notice: ServerLoadNotice | null;
  isAddingServer: boolean;

  loadDefaults: () => Promise<void>;
  addCustomServer: (server: PredefinedServer) => boolean;
  removeServer: (id: string) => void;
  select: (id: string) => void;
  deselect: () => void;
  setNotice: (notice: ServerLoadNotice | null) => void;
  setIsAddingServer: (isAdding: boolean) => void;
}

function getBaseUrl(): string {
  if (typeof document !== "undefined") {
    const scripts = document.querySelectorAll(
      'script[src*="mcp-server-card-ui"]',
    );
    if (scripts.length > 0) {
      const src = (scripts[scripts.length - 1] as HTMLScriptElement).src;
      return src.substring(0, src.lastIndexOf("/") + 1);
    }
  }
  return import.meta.env.BASE_URL;
}

/* ---------- Store ---------- */

export const usePredefinedServersStore = create<PredefinedServersState>(
  (set) => ({
    servers: [],
    selectedId: null,
    loading: false,
    notice: null,
    isAddingServer: false,

    loadDefaults: async () => {
      set({ loading: true });

      const issues: string[] = [];
      const configured = validatePredefinedServers(
        getConfigServers(),
        "Configured predefined servers",
      );
      issues.push(...configured.issues.map(formatPredefinedServerIssue));
      let defaults = configured.servers;

      if (defaults.length === 0) {
        try {
          const res = await fetch(`${getBaseUrl()}predefined-servers.json`);
          if (res.ok) {
            try {
              const bundled = validatePredefinedServers(
                await res.json(),
                "Bundled predefined servers",
              );
              defaults = bundled.servers;
              issues.push(...bundled.issues.map(formatPredefinedServerIssue));
            } catch (error) {
              issues.push(
                `Bundled predefined servers: response is not valid JSON: ${errorMessage(error)}.`,
              );
            }
          }
        } catch {
          // This optional asset is not present for every library consumer.
        }
      }

      // Fetch servers from ORD endpoint and deduplicate by URL
      const ordResult = await discoverServersFromOrd(getConfigOrdUrl());
      issues.push(...ordResult.issues.map(formatOrdDiscoveryIssue));
      const knownUrls = new Set(defaults.map((s) => s.url));
      const newOrdServers = ordResult.servers.filter(
        (s) => !knownUrls.has(s.url),
      );

      const storedResult = getStoredJsonResult<unknown>(
        CUSTOM_SERVERS_STORAGE_KEY,
        [],
      );
      const stored = validatePredefinedServers(
        storedResult.value,
        "Saved custom servers",
      );
      if (storedResult.error) {
        issues.push(
          `Saved custom servers: stored JSON could not be parsed: ${storedResult.error}. The invalid value was removed.`,
        );
      }
      issues.push(...stored.issues.map(formatPredefinedServerIssue));
      if (storedResult.error || stored.issues.length > 0) {
        setStoredJson(CUSTOM_SERVERS_STORAGE_KEY, stored.servers);
      }

      const servers = mergeUniqueServers(
        [
          { source: "Saved custom servers", servers: stored.servers },
          { source: "Configured ORD servers", servers: newOrdServers },
          { source: "Predefined servers", servers: defaults },
        ],
        issues,
      );
      const notice: ServerLoadNotice | null =
        issues.length > 0
          ? {
              severity: servers.length > 0 ? "warning" : "error",
              summary:
                servers.length > 0
                  ? "Some server definitions could not be loaded."
                  : "No valid predefined servers could be loaded.",
              details: issues,
            }
          : null;
      set({
        servers,
        loading: false,
        notice,
      });
    },

    addCustomServer: (server) => {
      const validation = validatePredefinedServers([server], "Custom server");
      const validServer = validation.servers[0];
      if (!validServer) {
        set({
          notice: {
            severity: "error",
            summary: "The custom server was not added.",
            details: validation.issues.map(formatPredefinedServerIssue),
          },
        });
        return false;
      }
      if (
        usePredefinedServersStore
          .getState()
          .servers.some((existing) => existing.id === validServer.id)
      ) {
        set({
          notice: {
            severity: "error",
            summary: "The custom server was not added.",
            details: [
              `Custom server, server "${validServer.id}", id: A server with this ID already exists.`,
            ],
          },
        });
        return false;
      }
      set((state) => {
        const newServers = [...state.servers, validServer];
        persistCustom(newServers);
        return { servers: newServers };
      });
      return true;
    },

    removeServer: (id) => {
      set((state) => {
        const newServers = state.servers.filter((s) => s.id !== id);
        persistCustom(newServers);
        return { servers: newServers };
      });
    },

    select: (id) => set({ selectedId: id }),
    deselect: () => set({ selectedId: null }),
    setNotice: (notice) => set({ notice }),
    setIsAddingServer: (isAddingServer) => set({ isAddingServer }),
  }),
);

function persistCustom(servers: PredefinedServer[]) {
  const validated = validatePredefinedServers(servers, "Custom servers");
  const custom = validated.servers.filter((s) => s.id.startsWith("custom-"));
  setStoredJson(CUSTOM_SERVERS_STORAGE_KEY, custom);
}

function mergeUniqueServers(
  groups: { source: string; servers: PredefinedServer[] }[],
  issues: string[],
): PredefinedServer[] {
  const merged: PredefinedServer[] = [];
  const sourceById = new Map<string, string>();
  for (const group of groups) {
    for (const server of group.servers) {
      const existingSource = sourceById.get(server.id);
      if (existingSource) {
        issues.push(
          `${group.source}, server "${server.id}", id: Duplicate server ID already loaded from ${existingSource}. The later server was skipped.`,
        );
        continue;
      }
      sourceById.set(server.id, group.source);
      merged.push(server);
    }
  }
  return merged;
}

export const selectSelectedServer = (
  state: PredefinedServersState,
): PredefinedServer | null => {
  return state.servers.find((s) => s.id === state.selectedId) ?? null;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
