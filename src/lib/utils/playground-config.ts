import type { PredefinedServer } from "@lib/types/connection";

interface PlaygroundAuthConfig {
  apiKey?: string;
  oauth?: { clientId: string; clientSecret: string; tokenUrl: string };
  basic?: { username: string; password: string };
}

interface PlaygroundConfig {
  servers: PredefinedServer[];
  ordUrl: string;
  auth: PlaygroundAuthConfig;
}

function parse(): PlaygroundConfig {
  const raw = import.meta.env.VITE_PLAYGROUND_CONFIG ?? "";
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        servers: parsed.servers ?? [],
        ordUrl: parsed.ordUrl ?? "",
        auth: parsed.auth ?? {},
      };
    } catch {
      // fall through to legacy env vars
    }
  }

  // Backwards compat: read individual env vars
  let servers: PredefinedServer[] = [];
  const envServers = import.meta.env.VITE_PREDEFINED_SERVERS ?? "";
  if (envServers) {
    try {
      servers = JSON.parse(envServers);
    } catch {
      // ignore
    }
  }

  const auth: PlaygroundAuthConfig = {};
  const apiKey = import.meta.env.VITE_AUTH_API_KEY;
  if (apiKey) auth.apiKey = apiKey;

  const oauthClientId = import.meta.env.VITE_OAUTH_CLIENT_ID;
  const oauthClientSecret = import.meta.env.VITE_OAUTH_CLIENT_SECRET;
  const oauthTokenUrl = import.meta.env.VITE_OAUTH_TOKEN_URL;
  if (oauthClientId && oauthClientSecret && oauthTokenUrl) {
    auth.oauth = { clientId: oauthClientId, clientSecret: oauthClientSecret, tokenUrl: oauthTokenUrl };
  }

  const basicUser = import.meta.env.VITE_AUTH_BASIC_USER;
  const basicPass = import.meta.env.VITE_AUTH_BASIC_PASS;
  if (basicUser && basicPass) {
    auth.basic = { username: basicUser, password: basicPass };
  }

  return {
    servers,
    ordUrl: import.meta.env.VITE_MCP_SERVERS_ORD_URL ?? "",
    auth,
  };
}

const config = parse();

export function getConfigServers(): PredefinedServer[] {
  return config.servers;
}

export function getConfigOrdUrl(): string {
  return config.ordUrl;
}

export function getConfigAuth(): PlaygroundAuthConfig {
  return config.auth;
}
