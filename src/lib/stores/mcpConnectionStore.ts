import { create } from "zustand";
import type {
  AuthType,
  BasicCredentials,
  BearerCredentials,
  OAuth2Credentials,
  ConnectionStatus,
  PredefinedServer,
} from "@lib/types/connection";
import type { MCPServerCardDefinition } from "../types/mcp-protocol";
import { getConfigAuth } from "@lib/utils/playground-config";
import { sendRequest, sendNotification, deleteSession, type MCPTransportConfig, type MCPTransportResult } from "@lib/utils/mcp-transport";
import { resetIdCounter, isErrorResponse } from "@lib/utils/mcp-jsonrpc";
import { useMCPLogStore } from "./mcpLogStore";
import { useServerCardStore } from "./serverCardStore";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  storeOAuthParams,
  getStoredOAuthParams,
  clearOAuthParams,
  getDefaultOAuthRedirectUri,
} from "@lib/utils/pkce";

// Compute auth headers from current credentials
function computeAuthHeaders(
  authType: AuthType,
  basicCredentials: BasicCredentials,
  bearerCredentials: BearerCredentials,
  oauth2Credentials: OAuth2Credentials,
): Record<string, string> {
  switch (authType) {
    case "basic": {
      const { username, password } = basicCredentials;
      if (username && password) {
        return { Authorization: `Basic ${btoa(`${username}:${password}`)}` };
      }
      return {};
    }
    case "bearer": {
      const { token } = bearerCredentials;
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
      return {};
    }
    case "oauth2": {
      const { accessToken } = oauth2Credentials;
      if (accessToken) {
        return { Authorization: `Bearer ${accessToken}` };
      }
      return {};
    }
    default:
      return {};
  }
}

export interface ServerInfo {
  name: string;
  version: string;
}

export interface ServerCapabilities {
  tools?: { listChanged?: boolean };
  resources?: { subscribe?: boolean; listChanged?: boolean };
  prompts?: { listChanged?: boolean };
  logging?: Record<string, unknown>;
}

interface MCPConnectionState {
  // Connection
  url: string;
  transportType: "streamable-http" | "sse";
  protocolVersion: string;
  connectionStatus: ConnectionStatus;
  errorMessage: string;
  sessionId: string | null;

  // Server info (from initialize response)
  serverInfo: ServerInfo | null;
  serverCapabilities: ServerCapabilities | null;

  // Auth
  authType: AuthType;
  basicCredentials: BasicCredentials;
  bearerCredentials: BearerCredentials;
  oauth2Credentials: OAuth2Credentials;
  authHeaders: Record<string, string>;
  isTokenLoading: boolean;
  tokenError: string;
  isAuthFlowInProgress: boolean;

  // Actions
  setUrl: (url: string) => void;
  setTransportType: (type: "streamable-http" | "sse") => void;
  setProtocolVersion: (version: string) => void;
  setAuthType: (type: AuthType) => void;
  setBasicCredentials: (creds: Partial<BasicCredentials>) => void;
  setBearerCredentials: (creds: Partial<BearerCredentials>) => void;
  setOAuth2Credentials: (creds: Partial<OAuth2Credentials>) => void;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  reset: () => void;
  setFromPredefined: (server: PredefinedServer) => void;
  autoConfigureAuth: (card: MCPServerCardDefinition) => void;
  fetchOAuth2Token: () => Promise<boolean>;
  startAuthCodeFlow: () => Promise<void>;
  handleAuthCallback: (code: string, state: string) => Promise<boolean>;
  cancelAuthFlow: () => void;
  getTransportConfig: () => MCPTransportConfig;
}

const EMPTY_AUTH_HEADERS: Record<string, string> = {};
const DEFAULT_PROTOCOL_VERSION = "2025-03-26";

// Env-var-based credentials for auto-retry on 401/403
interface AuthStrategy {
  authType: AuthType;
  authHeaders: Record<string, string>;
  urlSuffix?: string; // e.g. "?api_key=xxx" for query-param auth
  basicCredentials?: BasicCredentials;
  bearerCredentials?: BearerCredentials;
  oauth2Credentials?: OAuth2Credentials;
}

function getEnvAuthStrategies(): AuthStrategy[] {
  const strategies: AuthStrategy[] = [];
  const auth = getConfigAuth();

  if (auth.apiKey) {
    const apiKey = auth.apiKey;
    // 1. X-API-Key header (e.g. bookshop server)
    strategies.push({
      authType: "bearer",
      bearerCredentials: { token: apiKey },
      authHeaders: { "X-API-Key": apiKey },
    });

    // 2. api_key query parameter (e.g. devops server)
    strategies.push({
      authType: "bearer",
      bearerCredentials: { token: apiKey },
      authHeaders: {},
      urlSuffix: `api_key=${encodeURIComponent(apiKey)}`,
    });

    // 3. Bearer Authorization header
    strategies.push({
      authType: "bearer",
      bearerCredentials: { token: apiKey },
      authHeaders: { Authorization: `Bearer ${apiKey}` },
    });
  }

  // 4. OAuth2 Client Credentials (needs token fetch first)
  if (auth.oauth) {
    strategies.push({
      authType: "oauth2",
      oauth2Credentials: { clientId: auth.oauth.clientId, clientSecret: auth.oauth.clientSecret, tokenUrl: auth.oauth.tokenUrl, scopes: "" },
      authHeaders: {},
    });
  }

  // 5. Basic Auth
  if (auth.basic) {
    strategies.push({
      authType: "basic",
      basicCredentials: { username: auth.basic.username, password: auth.basic.password },
      authHeaders: { Authorization: `Basic ${btoa(`${auth.basic.username}:${auth.basic.password}`)}` },
    });
  }

  return strategies;
}

function isAuthError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return /\b(401|403)\b/.test(err.message);
}

// Keep popup reference outside store
let oauthPopup: Window | null = null;

export const useMCPConnectionStore = create<MCPConnectionState>((set, get) => ({
  // Connection
  url: "",
  transportType: "streamable-http",
  protocolVersion: DEFAULT_PROTOCOL_VERSION,
  connectionStatus: "disconnected",
  errorMessage: "",
  sessionId: null,

  // Server info
  serverInfo: null,
  serverCapabilities: null,

  // Auth
  authType: "none",
  basicCredentials: { username: "", password: "" },
  bearerCredentials: { token: "" },
  oauth2Credentials: {
    clientId: "",
    clientSecret: "",
    tokenUrl: "",
    scopes: "",
  },
  authHeaders: EMPTY_AUTH_HEADERS,
  isTokenLoading: false,
  tokenError: "",
  isAuthFlowInProgress: false,

  // Setters
  setUrl: (url) => set({ url }),
  setTransportType: (transportType) => set({ transportType }),
  setProtocolVersion: (protocolVersion) => set({ protocolVersion }),

  setAuthType: (authType) => {
    const state = get();
    const authHeaders = computeAuthHeaders(authType, state.basicCredentials, state.bearerCredentials, state.oauth2Credentials);
    set({ authType, authHeaders });
  },

  setBasicCredentials: (creds) => {
    const state = get();
    const basicCredentials = { ...state.basicCredentials, ...creds };
    const authHeaders = computeAuthHeaders(state.authType, basicCredentials, state.bearerCredentials, state.oauth2Credentials);
    set({ basicCredentials, authHeaders });
  },

  setBearerCredentials: (creds) => {
    const state = get();
    const bearerCredentials = { ...state.bearerCredentials, ...creds };
    const authHeaders = computeAuthHeaders(state.authType, state.basicCredentials, bearerCredentials, state.oauth2Credentials);
    set({ bearerCredentials, authHeaders });
  },

  setOAuth2Credentials: (creds) => {
    const state = get();
    const oauth2Credentials = { ...state.oauth2Credentials, ...creds };
    const authHeaders = computeAuthHeaders(state.authType, state.basicCredentials, state.bearerCredentials, oauth2Credentials);
    set({ oauth2Credentials, authHeaders });
  },

  getTransportConfig: () => {
    const state = get();
    return {
      url: state.url,
      protocolVersion: state.protocolVersion,
      sessionId: state.sessionId ?? undefined,
      authHeaders: state.authHeaders,
    };
  },

  connect: async () => {
    const state = get();
    if (!state.url) return false;

    set({ connectionStatus: "connecting", errorMessage: "" });
    resetIdCounter();

    // If OAuth2 is configured with credentials but no token yet, fetch one first
    if (
      state.authType === "oauth2" &&
      !state.oauth2Credentials.accessToken &&
      state.oauth2Credentials.tokenUrl &&
      state.oauth2Credentials.clientId &&
      state.oauth2Credentials.clientSecret
    ) {
      const tokenOk = await get().fetchOAuth2Token();
      if (!tokenOk) {
        set({
          connectionStatus: "error",
          errorMessage: get().tokenError || "Failed to fetch OAuth2 token",
        });
        return false;
      }
    }

    try {
      const config: MCPTransportConfig = {
        url: get().url,
        protocolVersion: get().protocolVersion,
        authHeaders: get().authHeaders,
      };

      // Step 1: Send initialize request
      const initResult = await sendRequest(config, "initialize", {
        protocolVersion: state.protocolVersion,
        capabilities: {},
        clientInfo: {
          name: "mcp-server-card-ui",
          version: "0.1.0",
        },
      });

      if (isErrorResponse(initResult.response)) {
        const err = initResult.response.error!;
        throw new Error(`Initialize failed: ${err.message} (code: ${err.code})`);
      }

      const result = initResult.response.result as Record<string, unknown>;
      const serverInfo = result.serverInfo as ServerInfo | undefined;
      const capabilities = result.capabilities as ServerCapabilities | undefined;
      const sessionId = initResult.sessionId ?? null;

      // Update config with session ID for the notification
      const connectedConfig: MCPTransportConfig = {
        ...config,
        sessionId: sessionId ?? undefined,
      };

      // Step 2: Send initialized notification
      await sendNotification(connectedConfig, "notifications/initialized");

      set({
        connectionStatus: "connected",
        serverInfo: serverInfo ?? null,
        serverCapabilities: capabilities ?? null,
        sessionId,
      });

      // Step 3: Fetch capabilities and build server card (best-effort, don't fail connection)
      try {
        await buildServerCardFromConnection(connectedConfig, serverInfo, capabilities);
      } catch {
        // Non-fatal: connection succeeded but card generation failed
      }

      return true;
    } catch (err) {
      // Auto-retry with env credentials on auth errors when no auth is configured
      if (isAuthError(err) && state.authType === "none") {
        const strategies = getEnvAuthStrategies();
        for (const strategy of strategies) {
          try {
            set({ connectionStatus: "connecting", errorMessage: `Trying ${strategy.authType} authentication...` });
            resetIdCounter();

            let authHeaders = strategy.authHeaders;

            // OAuth2 needs a token fetch first
            if (strategy.authType === "oauth2" && strategy.oauth2Credentials) {
              const creds = strategy.oauth2Credentials;
              const body = new URLSearchParams({
                grant_type: "client_credentials",
                client_id: creds.clientId,
                client_secret: creds.clientSecret,
              });
              if (creds.scopes) body.append("scope", creds.scopes);

              const tokenResp = await fetch(creds.tokenUrl, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: body.toString(),
              });
              if (!tokenResp.ok) continue;
              const tokenData = await tokenResp.json();
              if (!tokenData.access_token) continue;

              strategy.oauth2Credentials = {
                ...creds,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                expiresAt: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : undefined,
              };
              authHeaders = { Authorization: `Bearer ${tokenData.access_token}` };
            }

            const retryUrl = strategy.urlSuffix
              ? `${state.url}${state.url.includes("?") ? "&" : "?"}${strategy.urlSuffix}`
              : state.url;

            const retryConfig: MCPTransportConfig = {
              url: retryUrl,
              protocolVersion: state.protocolVersion,
              authHeaders,
            };

            const retryResult = await sendRequest(retryConfig, "initialize", {
              protocolVersion: state.protocolVersion,
              capabilities: {},
              clientInfo: { name: "mcp-server-card-ui", version: "0.1.0" },
            });

            if (isErrorResponse(retryResult.response)) continue;

            const retryData = retryResult.response.result as Record<string, unknown>;
            const retryServerInfo = retryData.serverInfo as ServerInfo | undefined;
            const retryCaps = retryData.capabilities as ServerCapabilities | undefined;
            const retrySessionId = retryResult.sessionId ?? null;

            const retryConnConfig: MCPTransportConfig = {
              ...retryConfig,
              sessionId: retrySessionId ?? undefined,
            };

            await sendNotification(retryConnConfig, "notifications/initialized");

            // Success — persist the working credentials and update URL if query param was used
            set({
              connectionStatus: "connected",
              errorMessage: "",
              url: retryUrl,
              serverInfo: retryServerInfo ?? null,
              serverCapabilities: retryCaps ?? null,
              sessionId: retrySessionId,
              authType: strategy.authType,
              authHeaders,
              ...(strategy.basicCredentials ? { basicCredentials: strategy.basicCredentials } : {}),
              ...(strategy.bearerCredentials ? { bearerCredentials: strategy.bearerCredentials } : {}),
              ...(strategy.oauth2Credentials ? { oauth2Credentials: strategy.oauth2Credentials } : {}),
            });

            try {
              await buildServerCardFromConnection(retryConnConfig, retryServerInfo, retryCaps);
            } catch {
              // Non-fatal
            }

            return true;
          } catch {
            // This strategy failed, try the next one
            continue;
          }
        }
      }

      set({
        connectionStatus: "error",
        errorMessage: err instanceof Error ? err.message : "Connection failed",
      });
      return false;
    }
  },

  disconnect: async () => {
    const state = get();

    if (state.sessionId) {
      await deleteSession({
        url: state.url,
        sessionId: state.sessionId,
        authHeaders: state.authHeaders,
      });
    }

    set({
      connectionStatus: "disconnected",
      errorMessage: "",
      sessionId: null,
      serverInfo: null,
      serverCapabilities: null,
    });
  },

  reset: () => {
    set({
      url: "",
      transportType: "streamable-http",
      protocolVersion: DEFAULT_PROTOCOL_VERSION,
      connectionStatus: "disconnected",
      errorMessage: "",
      sessionId: null,
      serverInfo: null,
      serverCapabilities: null,
      authType: "none",
      basicCredentials: { username: "", password: "" },
      bearerCredentials: { token: "" },
      oauth2Credentials: {
        clientId: "",
        clientSecret: "",
        tokenUrl: "",
        scopes: "",
      },
      authHeaders: EMPTY_AUTH_HEADERS,
      isTokenLoading: false,
      tokenError: "",
      isAuthFlowInProgress: false,
    });
    oauthPopup = null;
    useMCPLogStore.getState().clearLogs();
    resetIdCounter();
  },

  setFromPredefined: (server) => {
    let basicCredentials: BasicCredentials = { username: "", password: "" };
    let bearerCredentials: BearerCredentials = { token: "" };
    let oauth2Credentials: OAuth2Credentials = { clientId: "", clientSecret: "", tokenUrl: "", scopes: "" };
    const authType = server.authType ?? "none";

    if (server.authConfig) {
      switch (authType) {
        case "basic":
          basicCredentials = server.authConfig as unknown as BasicCredentials;
          break;
        case "bearer":
          bearerCredentials = server.authConfig as unknown as BearerCredentials;
          break;
        case "oauth2":
          oauth2Credentials = server.authConfig as unknown as OAuth2Credentials;
          break;
      }
    }

    const authHeaders = {
      ...computeAuthHeaders(authType, basicCredentials, bearerCredentials, oauth2Credentials),
      ...server.authHeaders,
    };

    let url = server.url;
    if (server.urlSuffix) {
      url += `${url.includes("?") ? "&" : "?"}${server.urlSuffix}`;
    }

    set({
      url,
      transportType: server.transportType,
      authType: authType === "none" && server.authHeaders ? "bearer" : authType,
      basicCredentials,
      bearerCredentials,
      oauth2Credentials,
      authHeaders,
    });
  },

  autoConfigureAuth: (card) => {
    const auth = card.authentication;
    if (!auth || !auth.required) {
      set({ authType: "none" });
      return;
    }

    const schemas = auth.schemas;
    if (!schemas || schemas.length === 0) {
      set({ authType: "none" });
      return;
    }

    // Use the first supported schema
    const firstSchema = schemas[0] as string;
    const state = get();

    switch (firstSchema) {
      case "basic": {
        const authHeaders = computeAuthHeaders("basic", state.basicCredentials, state.bearerCredentials, state.oauth2Credentials);
        set({ authType: "basic", authHeaders });
        break;
      }
      case "bearer": {
        const authHeaders = computeAuthHeaders("bearer", state.basicCredentials, state.bearerCredentials, state.oauth2Credentials);
        set({ authType: "bearer", authHeaders });
        break;
      }
      case "oauth2": {
        const authHeaders = computeAuthHeaders("oauth2", state.basicCredentials, state.bearerCredentials, state.oauth2Credentials);
        set({ authType: "oauth2", authHeaders });
        break;
      }
      default:
        set({ authType: "none" });
    }
  },

  fetchOAuth2Token: async () => {
    const state = get();
    const { clientId, clientSecret, tokenUrl, scopes } = state.oauth2Credentials;

    if (!tokenUrl) {
      set({ tokenError: "Token URL is required" });
      return false;
    }

    if (!clientId || !clientSecret) {
      set({ tokenError: "Client ID and Client Secret are required" });
      return false;
    }

    set({ isTokenLoading: true, tokenError: "" });

    try {
      const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      });

      if (scopes) {
        body.append("scope", scopes);
      }

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Token request failed: ${response.status} ${text}`);
      }

      const data = await response.json();
      const accessToken = data.access_token;

      if (!accessToken) {
        throw new Error("No access_token in response");
      }

      const oauth2Credentials = {
        ...state.oauth2Credentials,
        accessToken,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
      };

      const authHeaders = computeAuthHeaders("oauth2", state.basicCredentials, state.bearerCredentials, oauth2Credentials);

      set({
        oauth2Credentials,
        authHeaders,
        isTokenLoading: false,
        tokenError: "",
      });

      return true;
    } catch (err) {
      set({
        isTokenLoading: false,
        tokenError: err instanceof Error ? err.message : "Failed to fetch token",
      });
      return false;
    }
  },

  startAuthCodeFlow: async () => {
    const state = get();
    const { clientId, scopes, redirectUri } = state.oauth2Credentials;
    const authorizationUrl = state.oauth2Credentials.authorizationUrl;

    if (!authorizationUrl) {
      set({ tokenError: "Authorization URL is required" });
      return;
    }

    if (!clientId) {
      set({ tokenError: "Client ID is required" });
      return;
    }

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const oauthState = generateState();
    const finalRedirectUri = redirectUri || getDefaultOAuthRedirectUri();

    storeOAuthParams({
      codeVerifier,
      state: oauthState,
      redirectUri: finalRedirectUri,
    });

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: finalRedirectUri,
      state: oauthState,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    if (scopes) {
      params.append("scope", scopes);
    }

    const authUrl = `${authorizationUrl}?${params.toString()}`;
    const popup = window.open(authUrl, "oauth_popup", "width=600,height=700,scrollbars=yes,resizable=yes");

    if (!popup) {
      set({ tokenError: "Failed to open authorization popup. Please allow popups." });
      clearOAuthParams();
      return;
    }

    set({ isAuthFlowInProgress: true, tokenError: "" });
    oauthPopup = popup;

    const MAX_POPUP_WAIT_MS = 5 * 60 * 1000;
    const popupOpenedAt = Date.now();
    const checkClosed = setInterval(() => {
      if (popup.closed || Date.now() - popupOpenedAt > MAX_POPUP_WAIT_MS) {
        clearInterval(checkClosed);
        const currentState = get();
        if (currentState.isAuthFlowInProgress) {
          set({
            isAuthFlowInProgress: false,
            tokenError: popup.closed ? "Authorization was cancelled" : "Authorization timed out",
          });
          oauthPopup = null;
          clearOAuthParams();
        }
      }
    }, 500);
  },

  handleAuthCallback: async (code: string, returnedState: string) => {
    const state = get();
    const stored = getStoredOAuthParams();

    if (!stored.state || stored.state !== returnedState) {
      set({ tokenError: "Invalid state parameter", isAuthFlowInProgress: false });
      clearOAuthParams();
      return false;
    }

    if (!stored.codeVerifier) {
      set({ tokenError: "Missing code verifier", isAuthFlowInProgress: false });
      clearOAuthParams();
      return false;
    }

    const { tokenUrl, clientId, clientSecret } = state.oauth2Credentials;
    if (!tokenUrl) {
      set({ tokenError: "Token URL is required", isAuthFlowInProgress: false });
      clearOAuthParams();
      return false;
    }

    set({ isTokenLoading: true, tokenError: "" });

    try {
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: stored.redirectUri || "",
        client_id: clientId,
        code_verifier: stored.codeVerifier,
      });

      if (clientSecret) {
        body.append("client_secret", clientSecret);
      }

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Token request failed: ${response.status} ${text}`);
      }

      const data = await response.json();
      const accessToken = data.access_token;

      if (!accessToken) {
        throw new Error("No access_token in response");
      }

      const oauth2Credentials = {
        ...state.oauth2Credentials,
        accessToken,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
      };

      const authHeaders = computeAuthHeaders("oauth2", state.basicCredentials, state.bearerCredentials, oauth2Credentials);

      if (oauthPopup && !oauthPopup.closed) {
        oauthPopup.close();
      }

      set({
        oauth2Credentials,
        authHeaders,
        isTokenLoading: false,
        isAuthFlowInProgress: false,
        tokenError: "",
      });
      oauthPopup = null;
      clearOAuthParams();
      return true;
    } catch (err) {
      set({
        isTokenLoading: false,
        isAuthFlowInProgress: false,
        tokenError: err instanceof Error ? err.message : "Failed to exchange code for token",
      });
      clearOAuthParams();
      return false;
    }
  },

  cancelAuthFlow: () => {
    if (oauthPopup && !oauthPopup.closed) {
      oauthPopup.close();
    }
    oauthPopup = null;
    clearOAuthParams();
    set({ isAuthFlowInProgress: false, tokenError: "" });
  },
}));

/**
 * Fetch tools/resources/prompts from a connected server and build a server card JSON.
 */
async function buildServerCardFromConnection(
  config: MCPTransportConfig,
  serverInfo: ServerInfo | undefined,
  capabilities: ServerCapabilities | undefined,
): Promise<void> {
  // Only fetch what the server advertises
  const fetches: Promise<MCPTransportResult | null>[] = [];
  const fetchKeys: string[] = [];

  if (capabilities?.tools) {
    fetches.push(sendRequest(config, "tools/list").catch(() => null));
    fetchKeys.push("tools");
  }
  if (capabilities?.resources) {
    fetches.push(sendRequest(config, "resources/list").catch(() => null));
    fetchKeys.push("resources");
  }
  if (capabilities?.prompts) {
    fetches.push(sendRequest(config, "prompts/list").catch(() => null));
    fetchKeys.push("prompts");
  }

  const results = await Promise.all(fetches);

  let tools: unknown[] | undefined;
  let resources: unknown[] | undefined;
  let prompts: unknown[] | undefined;

  for (let i = 0; i < fetchKeys.length; i++) {
    const r = results[i];
    if (!r || isErrorResponse(r.response)) continue;
    const result = r.response.result as Record<string, unknown>;
    switch (fetchKeys[i]) {
      case "tools":
        tools = result.tools as unknown[];
        break;
      case "resources":
        resources = result.resources as unknown[];
        break;
      case "prompts":
        prompts = result.prompts as unknown[];
        break;
    }
  }

  const card: Record<string, unknown> = {
    $schema: "https://raw.githubusercontent.com/anthropics/model-context-protocol/refs/heads/main/schema/2025-03-26/schema.json",
    name: serverInfo?.name ?? "unknown/server",
    version: serverInfo?.version ?? "0.0.0",
    supportedProtocolVersions: [config.protocolVersion ?? "2025-03-26"],
    description: `Server card auto-generated from live MCP connection to ${serverInfo?.name ?? config.url}`,
    remotes: [{ type: "streamable-http", url: config.url }],
    capabilities: capabilities ?? {},
  };

  if (tools && tools.length > 0) card.tools = tools;
  if (resources && resources.length > 0) card.resources = resources;
  if (prompts && prompts.length > 0) card.prompts = prompts;

  const json = JSON.stringify(card, null, 2);
  useServerCardStore.getState().setRawJson(json);
}

// Selectors
export const selectAuthHeaders = (state: MCPConnectionState): Record<string, string> => state.authHeaders;
export const selectIsConnected = (state: MCPConnectionState): boolean => state.connectionStatus === "connected";
