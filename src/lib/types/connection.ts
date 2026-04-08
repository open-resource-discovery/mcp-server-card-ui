export type AuthType = "none" | "basic" | "bearer" | "oauth2";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface BasicCredentials {
  username: string;
  password: string;
}

export interface BearerCredentials {
  token: string;
}

export interface OAuth2Credentials {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scopes: string;
  accessToken?: string;
  authorizationUrl?: string;
  redirectUri?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface PredefinedServer {
  id: string;
  name: string;
  title?: string;
  description: string;
  url: string;
  transportType: "streamable-http" | "sse";
  iconUrl?: string;
  authType?: AuthType;
  authConfig?: Record<string, string>;
  authHeaders?: Record<string, string>;
  urlSuffix?: string;
  tags?: string[];
  mocked?: boolean;
  serverCard?: string;
}
