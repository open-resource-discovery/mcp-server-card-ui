/**
 * Standalone bundle entry point for CDN/script tag usage.
 * Bundles React so it works without a build system.
 *
 * Usage:
 * ```html
 * <link rel="stylesheet" href="mcp-server-card-ui.css">
 * <script src="mcp-server-card-ui.js"></script>
 * <script>
 *   MCPPlayground.init({
 *     el: '#container',
 *     serverCard: '{ ... }',
 *   });
 * </script>
 * ```
 */
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  MCPServerPlayground,
  type MCPServerPlaygroundProps,
} from "./components/MCPServerPlayground";
import {
  MCPServerCardView,
  type MCPServerCardViewProps,
} from "./components/MCPServerCardView";
import {
  MCPServerViewer,
  type MCPServerViewerProps,
} from "./components/MCPServerViewer";
import {
  MCPServerEditor,
  type MCPServerEditorProps,
} from "./components/MCPServerEditor";
import { useServerCardStore } from "./stores/serverCardStore";
import { useMCPConnectionStore } from "./stores/mcpConnectionStore";
import { useValidationStore } from "./stores/validationStore";
import { useUIStore } from "./stores/uiStore";
import { useFunctionsStore } from "./stores/functionsStore";
import type { MCPServerCardDefinition } from "./types/mcp-protocol";
import type { ValidationResult } from "./types/validation";
import type { AuthType, PredefinedServer } from "./types/connection";
import { useThemeStore } from "./hooks/useTheme";

import "./styles.css";

// ============================================================================
// Types
// ============================================================================

export interface MCPPlaygroundOptions {
  el: string | HTMLElement;
  serverUrl?: string;
  serverCard?: string;
  showFunctions?: boolean;
  showRawHttp?: boolean;
  showValidation?: boolean;
  showSettings?: boolean;
  showEditor?: boolean;
  readOnly?: boolean;
  defaultTab?: "overview" | "functions" | "rawhttp" | "validation";
  forceDesktop?: boolean;
  auth?: {
    type: AuthType;
    credentials?: {
      username?: string;
      password?: string;
      token?: string;
    };
  };
  theme?: "light" | "dark" | "system";
  predefinedServers?: PredefinedServer[];
  onReady?: (instance: MCPPlaygroundInstance) => void;
  onServerCardChange?: (
    json: string,
    parsed: MCPServerCardDefinition | null,
  ) => void;
  onConnect?: (url: string) => void;
  onValidationComplete?: (results: ValidationResult[]) => void;
  onError?: (error: Error) => void;
}

export interface MCPPlaygroundInstance {
  setServerCard(json: string): void;
  getServerCard(): string;
  getParsedCard(): MCPServerCardDefinition | null;
  connect(url: string): Promise<boolean>;
  disconnect(): Promise<void>;
  validate(): Promise<ValidationResult[]>;
  setActiveTab(tab: "overview" | "functions" | "rawhttp" | "validation"): void;
  setTheme(theme: "light" | "dark" | "system"): void;
  callTool(name: string, args: Record<string, unknown>): Promise<void>;
  getPrompt(name: string, args: Record<string, unknown>): Promise<void>;
  destroy(): void;
}

export interface MCPComponentOptions {
  el: string | HTMLElement;
  serverUrl?: string;
  serverCard?: string;
  theme?: "light" | "dark" | "system";
  showValidation?: boolean;
  defaultTab?: "overview" | "validation";
  readOnly?: boolean;
  onServerCardChange?: (
    json: string,
    parsed: MCPServerCardDefinition | null,
  ) => void;
  onValidationComplete?: (results: ValidationResult[]) => void;
}

export interface MCPComponentInstance {
  setServerCard(json: string): void;
  getServerCard(): string;
  getParsedCard(): MCPServerCardDefinition | null;
  validate(): Promise<ValidationResult[]>;
  setTheme(theme: "light" | "dark" | "system"): void;
  destroy(): void;
}

export interface MCPPlaygroundAPI {
  init: (options: MCPPlaygroundOptions) => MCPPlaygroundInstance;
  cardView: (options: MCPComponentOptions) => MCPComponentInstance;
  viewer: (options: MCPComponentOptions) => MCPComponentInstance;
  editor: (options: MCPComponentOptions) => MCPComponentInstance;
  destroy: (container: HTMLElement | string) => void;
  version: string;
  MCPServerPlayground: typeof MCPServerPlayground;
  React: typeof React;
}

// ============================================================================
// Implementation
// ============================================================================

const roots = new Map<HTMLElement, Root>();
const instances = new Map<
  HTMLElement,
  MCPPlaygroundInstance | MCPComponentInstance
>();

function getElement(container: HTMLElement | string): HTMLElement {
  if (typeof container === "string") {
    const el = document.querySelector(container);
    if (!el)
      throw new Error(`MCPPlayground: Container not found: ${container}`);
    return el as HTMLElement;
  }
  return container;
}

function applyThemeToContainer(
  element: HTMLElement,
  theme: "light" | "dark" | "system",
) {
  element.classList.add("mcp-root");
  if (theme === "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    element.classList.toggle("dark", prefersDark);
  } else {
    element.classList.toggle("dark", theme === "dark");
  }
}

function mountContainer(
  el: string | HTMLElement,
  theme: "light" | "dark" | "system" = "system",
): { element: HTMLElement; root: Root } {
  const element = getElement(el);

  if (roots.has(element)) {
    roots.get(element)!.unmount();
    roots.delete(element);
    instances.delete(element);
  }

  applyThemeToContainer(element, theme);
  if (!element.style.width) element.style.width = "100%";
  if (!element.style.height) element.style.height = "100%";
  useThemeStore.getState().setTheme(theme);

  const root = createRoot(element);
  roots.set(element, root);

  return { element, root };
}

function createComponentInstance(
  element: HTMLElement,
  options: MCPComponentOptions,
): MCPComponentInstance {
  const inst: MCPComponentInstance = {
    setServerCard(json) {
      useServerCardStore.getState().setRawJson(json);
    },
    getServerCard() {
      return useServerCardStore.getState().rawJson;
    },
    getParsedCard() {
      return useServerCardStore.getState().parsedCard;
    },
    async validate() {
      const json = useServerCardStore.getState().rawJson;
      await useValidationStore.getState().validate(json);
      const results = useValidationStore.getState().results;
      options.onValidationComplete?.(results);
      return results;
    },
    setTheme(theme) {
      applyThemeToContainer(element, theme);
      useThemeStore.getState().setTheme(theme);
    },
    destroy() {
      destroyContainer(element);
    },
  };
  instances.set(element, inst);
  return inst;
}

function destroyContainer(container: HTMLElement | string) {
  const element = getElement(container);
  if (roots.has(element)) {
    roots.get(element)!.unmount();
    roots.delete(element);
    instances.delete(element);
    element.classList.remove("mcp-root", "dark");
    element.replaceChildren();
  }
}

function createInstance(
  element: HTMLElement,
  options: MCPPlaygroundOptions,
): MCPPlaygroundInstance {
  const instance: MCPPlaygroundInstance = {
    setServerCard(json) {
      useServerCardStore.getState().setRawJson(json);
    },
    getServerCard() {
      return useServerCardStore.getState().rawJson;
    },
    getParsedCard() {
      return useServerCardStore.getState().parsedCard;
    },
    async connect(url) {
      const store = useMCPConnectionStore.getState();
      store.setUrl(url);
      const success = await store.connect();
      if (success && options.onConnect) {
        options.onConnect(url);
      }
      return success;
    },
    async disconnect() {
      await useMCPConnectionStore.getState().disconnect();
    },
    async validate() {
      const json = useServerCardStore.getState().rawJson;
      await useValidationStore.getState().validate(json);
      const results = useValidationStore.getState().results;
      options.onValidationComplete?.(results);
      return results;
    },
    setActiveTab(tab) {
      useUIStore.getState().setActiveTab(tab);
    },
    async callTool(name, args) {
      await useFunctionsStore.getState().callTool(name, args);
    },
    async getPrompt(name, args) {
      await useFunctionsStore.getState().getPrompt(name, args);
    },
    setTheme(theme) {
      applyThemeToContainer(element, theme);
      useThemeStore.getState().setTheme(theme);
    },
    destroy() {
      MCPPlayground.destroy(element);
    },
  };

  instances.set(element, instance);
  return instance;
}

const MCPPlayground: MCPPlaygroundAPI = {
  version: "__VERSION__",

  init(options) {
    const { element, root } = mountContainer(options.el, options.theme);

    if (options.auth) {
      const connStore = useMCPConnectionStore.getState();
      connStore.setAuthType(options.auth.type);
      if (options.auth.credentials) {
        const creds = options.auth.credentials;
        if (options.auth.type === "basic" && creds.username) {
          connStore.setBasicCredentials({
            username: creds.username,
            password: creds.password || "",
          });
        } else if (options.auth.type === "bearer" && creds.token) {
          connStore.setBearerCredentials({ token: creds.token });
        } else if (options.auth.type === "oauth2" && creds.token) {
          connStore.setOAuth2Credentials({ accessToken: creds.token });
        }
      }
    }

    if (options.serverCard) {
      useServerCardStore.getState().setRawJson(options.serverCard);
    }

    const props: MCPServerPlaygroundProps = {
      initialServerCard: options.serverCard,
      initialServerUrl: options.serverUrl,
      showFunctions: options.showFunctions ?? true,
      showRawHttp: options.showRawHttp ?? true,
      showValidation: options.showValidation ?? true,
      showSettings: options.showSettings ?? true,
      showEditor: options.showEditor ?? true,
      readOnly: options.readOnly ?? false,
      defaultTab: options.defaultTab ?? "overview",
      forceDesktop: options.forceDesktop ?? false,
      predefinedServers: options.predefinedServers,
      onServerCardChange: options.onServerCardChange,
      onConnect: options.onConnect,
      onValidationComplete: options.onValidationComplete,
    };

    root.render(React.createElement(MCPServerPlayground, props));

    const instance = createInstance(element, options);

    if (options.serverUrl && !options.serverCard) {
      setTimeout(async () => {
        try {
          await instance.connect(options.serverUrl!);
        } catch (err) {
          options.onError?.(
            err instanceof Error ? err : new Error(String(err)),
          );
        }
      }, 0);
    }

    if (options.onReady) {
      setTimeout(() => options.onReady!(instance), 0);
    }

    return instance;
  },

  cardView(options) {
    const { element, root } = mountContainer(options.el, options.theme);

    if (options.serverCard) {
      useServerCardStore.getState().setRawJson(options.serverCard);
    }

    const props: MCPServerCardViewProps = {
      initialServerCard: options.serverCard,
      initialServerUrl: options.serverUrl,
      showValidation: options.showValidation ?? true,
      defaultTab: options.defaultTab ?? "overview",
      readOnly: options.readOnly ?? false,
      onServerCardChange: options.onServerCardChange,
      onValidationComplete: options.onValidationComplete,
    };

    root.render(React.createElement(MCPServerCardView, props));
    return createComponentInstance(element, options);
  },

  viewer(options) {
    const { element, root } = mountContainer(options.el, options.theme);

    if (options.serverCard) {
      useServerCardStore.getState().setRawJson(options.serverCard);
    }

    const props: MCPServerViewerProps = {
      initialServerCard: options.serverCard,
      initialServerUrl: options.serverUrl,
      showValidation: options.showValidation ?? true,
      defaultTab: options.defaultTab ?? "overview",
      onServerCardChange: options.onServerCardChange,
      onValidationComplete: options.onValidationComplete,
    };

    root.render(React.createElement(MCPServerViewer, props));
    return createComponentInstance(element, options);
  },

  editor(options) {
    const { element, root } = mountContainer(options.el, options.theme);

    if (options.serverCard) {
      useServerCardStore.getState().setRawJson(options.serverCard);
    }

    const props: MCPServerEditorProps = {
      initialServerCard: options.serverCard,
      initialServerUrl: options.serverUrl,
      showValidation: options.showValidation ?? true,
      readOnly: options.readOnly ?? false,
      defaultTab: options.defaultTab ?? "overview",
      onServerCardChange: options.onServerCardChange,
      onValidationComplete: options.onValidationComplete,
    };

    root.render(React.createElement(MCPServerEditor, props));
    return createComponentInstance(element, options);
  },

  destroy(container) {
    destroyContainer(container);
  },

  MCPServerPlayground,
  React,
};

// Expose globally for CDN usage
declare global {
  interface Window {
    MCPPlayground: MCPPlaygroundAPI;
  }
}

(function () {
  if (typeof window !== "undefined") {
    window.MCPPlayground = MCPPlayground;
  }
})();

export default MCPPlayground;
