import { create } from "zustand";
import type { PredefinedServer } from "@lib/types/connection";
import { getStoredJson, setStoredJson } from "@lib/utils/local-storage";
import { getConfigServers, getConfigOrdUrl } from "@lib/utils/playground-config";

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
    const scripts = document.querySelectorAll('script[src*="mcp-playground"]');
    if (scripts.length > 0) {
      const src = (scripts[scripts.length - 1] as HTMLScriptElement).src;
      return src.substring(0, src.lastIndexOf("/") + 1);
    }
  }
  return import.meta.env.BASE_URL;
}

/* ---------- ORD (Open Resource Discovery) ---------- */

interface ORDConfig {
  baseUrl?: string;
  openResourceDiscoveryV1?: {
    documents?: { url: string }[];
  };
}

interface ORDApiResource {
  ordId: string;
  title?: string;
  shortDescription?: string;
  description?: string;
  apiProtocol?: string;
  entryPoints?: string[];
}

interface ORDDocument {
  apiResources?: ORDApiResource[];
}

async function fetchFromOrd(): Promise<PredefinedServer[]> {
  const ordUrl = getConfigOrdUrl();
  if (!ordUrl) return [];

  try {
    // Step 1: fetch ORD config
    let configUrl = ordUrl;
    if (!configUrl.includes(".well-known/open-resource-discovery")) {
      configUrl = configUrl.replace(/\/$/, "") + "/.well-known/open-resource-discovery";
    }

    const configRes = await fetch(configUrl);
    if (!configRes.ok) return [];
    const config: ORDConfig = await configRes.json();

    const baseUrl = config.baseUrl || new URL(configUrl).origin;
    const docUrls = config.openResourceDiscoveryV1?.documents?.map((d) => d.url) ?? [];

    // Step 2: fetch each ORD document and collect MCP apiResources
    const servers: PredefinedServer[] = [];

    for (const docPath of docUrls) {
      const docUrl = docPath.startsWith("http") ? docPath : `${baseUrl.replace(/\/$/, "")}${docPath}`;
      const docRes = await fetch(docUrl);
      if (!docRes.ok) continue;
      const doc: ORDDocument = await docRes.json();

      const mcpResources = (doc.apiResources ?? []).filter(
        (r) => r.apiProtocol === "mcp" && r.entryPoints?.length,
      );

      for (const r of mcpResources) {
        servers.push({
          id: r.ordId,
          name: r.ordId.split(":").slice(-2).join(":"),
          title: r.title,
          description: r.shortDescription || r.description || "",
          url: r.entryPoints![0],
          transportType: "streamable-http",
          tags: ["ORD"],
        });
      }
    }

    return servers;
  } catch {
    return [];
  }
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
    const ordServers = await fetchFromOrd();
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
