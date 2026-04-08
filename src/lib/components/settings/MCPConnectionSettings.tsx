import { useState, useCallback, useEffect } from "react";
import { useMCPConnectionStore } from "@lib/stores/mcpConnectionStore";
import { useServerCardStore } from "@lib/stores/serverCardStore";
import { Input } from "@lib/components/ui/input";
import { PasswordInput } from "@lib/components/ui/PasswordInput";
import { Button } from "@lib/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@lib/components/ui/select";
import { Loader2, Plug, Unplug } from "lucide-react";
import { type ConnAuthType, mapStoreAuthType } from "@lib/utils/connection-auth";

export function MCPConnectionSettings() {
  const {
    url,
    setUrl,
    transportType,
    setTransportType,
    connectionStatus,
    errorMessage,
    connect,
    disconnect,
    autoConfigureAuth,
    authType: storeAuthType,
    basicCredentials: storeBasicCreds,
    bearerCredentials: storeBearerCreds,
    oauth2Credentials: storeOAuth2Creds,
    serverInfo,
    serverCapabilities,
  } = useMCPConnectionStore();
  const { parsedCard } = useServerCardStore();

  const [manualAuthType, setManualAuthType] = useState<ConnAuthType | null>(null);
  const connAuthType = manualAuthType ?? mapStoreAuthType(storeAuthType, !!storeOAuth2Creds.accessToken);

  const username = storeBasicCreds.username;
  const password = storeBasicCreds.password;
  const token = storeBearerCreds.token || storeOAuth2Creds.accessToken || "";

  const [localUsername, setLocalUsername] = useState<string | null>(null);
  const [localPassword, setLocalPassword] = useState<string | null>(null);
  const [localToken, setLocalToken] = useState<string | null>(null);

  const effectiveUsername = localUsername ?? username;
  const effectivePassword = localPassword ?? password;
  const effectiveToken = localToken ?? token;

  useEffect(() => {
    setManualAuthType(null);
    setLocalUsername(null);
    setLocalPassword(null);
    setLocalToken(null);
  }, [storeAuthType]);

  const handleConnect = useCallback(async () => {
    // If user entered connection credentials, set them in the store first
    if (connAuthType === "basic" && (localUsername || localPassword)) {
      useMCPConnectionStore.getState().setBasicCredentials({
        username: effectiveUsername,
        password: effectivePassword,
      });
      useMCPConnectionStore.getState().setAuthType("basic");
    } else if (connAuthType === "bearer" && localToken) {
      useMCPConnectionStore.getState().setBearerCredentials({ token: effectiveToken });
      useMCPConnectionStore.getState().setAuthType("bearer");
    }

    const success = await connect();
    if (success && parsedCard) {
      autoConfigureAuth(parsedCard);
    }
  }, [connAuthType, effectiveUsername, effectivePassword, effectiveToken, localUsername, localPassword, localToken, connect, parsedCard, autoConfigureAuth]);

  const statusColor = {
    disconnected: "bg-muted",
    connecting: "bg-warning",
    connected: "bg-success",
    error: "bg-destructive",
  }[connectionStatus];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Connection</h3>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${statusColor}`} />
          <span className="text-xs text-muted-foreground capitalize">{connectionStatus}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Input
          placeholder="MCP Server URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && url && connectionStatus !== "connecting" && handleConnect()}
          className="h-8 text-xs"
        />

        <Select value={transportType} onValueChange={(v) => setTransportType(v as "streamable-http" | "sse")}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="streamable-http">Streamable HTTP</SelectItem>
            <SelectItem value="sse">SSE</SelectItem>
          </SelectContent>
        </Select>

        <Select value={connAuthType} onValueChange={(v) => setManualAuthType(v as ConnAuthType)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Authentication</SelectItem>
            <SelectItem value="basic">Basic Auth</SelectItem>
            <SelectItem value="bearer">Bearer Token</SelectItem>
          </SelectContent>
        </Select>

        {connAuthType === "basic" && (
          <div className="space-y-2">
            <Input
              placeholder="Username"
              value={effectiveUsername}
              onChange={(e) => setLocalUsername(e.target.value)}
              className="h-8 text-sm"
              autoComplete="off"
            />
            <PasswordInput
              placeholder="Password"
              value={effectivePassword}
              onChange={(e) => setLocalPassword(e.target.value)}
              className="h-8 text-sm"
              autoComplete="off"
            />
          </div>
        )}

        {connAuthType === "bearer" && (
          <PasswordInput
            placeholder="Bearer Token"
            value={effectiveToken}
            onChange={(e) => setLocalToken(e.target.value)}
            className="h-8 text-sm"
            autoComplete="off"
          />
        )}

        <div className="flex gap-2">
          {connectionStatus === "connected" ? (
            <Button variant="outline" size="sm" onClick={() => disconnect()}>
              <Unplug className="h-4 w-4 mr-1" />
              Disconnect
            </Button>
          ) : (
            <Button size="sm" onClick={handleConnect} disabled={!url || connectionStatus === "connecting"}>
              {connectionStatus === "connecting" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Plug className="h-4 w-4 mr-1" />
              )}
              Connect
            </Button>
          )}
        </div>

        {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}

        {serverInfo && connectionStatus === "connected" && (
          <div className="rounded-md border p-3 space-y-1">
            <p className="text-xs font-medium">
              {serverInfo.name} v{serverInfo.version}
            </p>
            {serverCapabilities && (
              <div className="flex flex-wrap gap-1">
                {serverCapabilities.tools && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    Tools
                  </span>
                )}
                {serverCapabilities.resources && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    Resources
                  </span>
                )}
                {serverCapabilities.prompts && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    Prompts
                  </span>
                )}
                {serverCapabilities.logging && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    Logging
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
