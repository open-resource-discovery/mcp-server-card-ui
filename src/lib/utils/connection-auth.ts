export type ConnAuthType = "none" | "basic" | "bearer";

export function mapStoreAuthType(storeType: string | null | undefined, hasAccessToken: boolean): ConnAuthType {
  if (storeType === "oauth2" && hasAccessToken) return "bearer";
  if (storeType === "bearer") return "bearer";
  if (storeType === "basic") return "basic";
  return "none";
}

export function buildConnHeaders(
  authType: ConnAuthType,
  username: string,
  password: string,
  token: string,
): Record<string, string> {
  switch (authType) {
    case "basic":
      if (username && password) {
        return { Authorization: `Basic ${btoa(`${username}:${password}`)}` };
      }
      return {};
    case "bearer":
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
      return {};
    default:
      return {};
  }
}
