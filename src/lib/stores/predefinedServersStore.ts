import { create } from "zustand";
import type { PredefinedServer } from "@lib/types/connection";
import { getStoredJson, setStoredJson } from "@lib/utils/local-storage";
import { getConfigServers, getConfigOrdUrl } from "@lib/utils/playground-config";
import { discoverServersFromOrd } from "@lib/utils/ord-discovery";

interface PredefinedServersState {
  servers: PredefinedServer[];
  selectedId: string | null;
  loading: boolean;

  loadDefaults: () => Promise<void>;
  addCustomServer: (server: PredefinedServer) => void;
  removeServer: (id: string) => void;
  select: (id: string) => void;
  deselect: () => void;
}

function getBaseUrl(): string {
  if (typeof document !== "undefined") {
    const scripts = document.querySelectorAll('script[src*="mcp-server-card-ui"]');
    if (scripts.length > 0) {
      const src = (scripts[scripts.length - 1] as HTMLScriptElement).src;
      return src.substring(0, src.lastIndexOf("/") + 1);
    }
  }
  return import.meta.env.BASE_URL;
}

/* ---------- Store ---------- */

export const usePredefinedServersStore = create<PredefinedServersState>((set) => ({
  servers: [],
  selectedId: null,
  loading: false,

  loadDefaults: async () => {
    set({ loading: true });

    let defaults: PredefinedServer[] = getConfigServers();

    if (defaults.length === 0) {
      try {
        const res = await fetch(`${getBaseUrl()}predefined-servers.json`);
        if (res.ok) {
          defaults = await res.json();
        }
      } catch {
        // Predefined servers are optional
      }
    }

    // Fetch servers from ORD endpoint and deduplicate by URL
    const ordServers = await discoverServersFromOrd(getConfigOrdUrl());
    const knownUrls = new Set(defaults.map((s) => s.url));
    const newOrdServers = ordServers.filter((s) => !knownUrls.has(s.url));

    const custom: PredefinedServer[] = getStoredJson("mcp-custom-servers", []);
    set({ servers: [...custom, ...newOrdServers, ...defaults], loading: false });
  },

  addCustomServer: (server) => {
    set((state) => {
      if (state.servers.some((s) => s.id === server.id)) return state;
      const newServers = [...state.servers, server];
      persistCustom(newServers);
      return { servers: newServers };
    });
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
}));

function persistCustom(servers: PredefinedServer[]) {
  const custom = servers.filter((s) => s.id.startsWith("custom-"));
  setStoredJson("mcp-custom-servers", custom);
}

export const selectSelectedServer = (state: PredefinedServersState): PredefinedServer | null => {
  return state.servers.find((s) => s.id === state.selectedId) ?? null;
};
