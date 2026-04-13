import { useState, useCallback, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { useMCPConnectionStore } from "@lib/stores/mcpConnectionStore";
import { useServerCardStore } from "@lib/stores/serverCardStore";
import { usePredefinedServersStore } from "@lib/stores/predefinedServersStore";
import { Input } from "@lib/components/ui/input";
import { PasswordInput } from "@lib/components/ui/PasswordInput";
import { Button } from "@lib/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@lib/components/ui/select";
import { Loader2, Plug, Plus, Unplug } from "lucide-react";
import {
  type ConnAuthType,
  mapStoreAuthType,
} from "@lib/utils/connection-auth";
import { cn } from "@lib/utils/cn";
import { isOrdUrl, discoverServersFromOrd } from "@lib/utils/ord-discovery";

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
    setFromPredefined,
    authType: storeAuthType,
    basicCredentials: storeBasicCreds,
    bearerCredentials: storeBearerCreds,
    oauth2Credentials: storeOAuth2Creds,
    serverInfo,
    serverCapabilities,
  } = useMCPConnectionStore();
  const { parsedCard, setRawJson } = useServerCardStore();
  const servers = usePredefinedServersStore((s) => s.servers);
  const addCustomServer = usePredefinedServersStore((s) => s.addCustomServer);
  const select = usePredefinedServersStore((s) => s.select);

  const [manualAuthType, setManualAuthType] = useState<ConnAuthType | null>(
    null,
  );
  const connAuthType =
    manualAuthType ??
    mapStoreAuthType(storeAuthType, !!storeOAuth2Creds.accessToken);

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

  const urlMatchesServer = servers.some((s) => s.url === url);
  const showAddButton = url.trim().length > 0 && !urlMatchesServer;
  const [isAdding, setIsAdding] = useState(false);

  const handleConnect = useCallback(async () => {
    if (connAuthType === "basic" && (localUsername || localPassword)) {
      useMCPConnectionStore.getState().setBasicCredentials({
        username: effectiveUsername,
        password: effectivePassword,
      });
      useMCPConnectionStore.getState().setAuthType("basic");
    } else if (connAuthType === "bearer" && localToken) {
      useMCPConnectionStore
        .getState()
        .setBearerCredentials({ token: effectiveToken });
      useMCPConnectionStore.getState().setAuthType("bearer");
    }

    const success = await connect();
    if (success && parsedCard) {
      autoConfigureAuth(parsedCard);
    }
  }, [
    connAuthType,
    effectiveUsername,
    effectivePassword,
    effectiveToken,
    localUsername,
    localPassword,
    localToken,
    connect,
    parsedCard,
    autoConfigureAuth,
  ]);

  const handleAdd = useCallback(async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    setIsAdding(true);
    try {
      // Try ORD discovery first if the URL looks like an ORD endpoint
      if (isOrdUrl(trimmedUrl)) {
        const discovered = await discoverServersFromOrd(trimmedUrl, "custom-");
        if (discovered.length > 0) {
          for (const server of discovered) {
            addCustomServer(server);
          }
          // Select and connect to the first discovered server
          const first = discovered[0];
          select(first.id);
          setFromPredefined(first);
          setRawJson("");
          setUrl("");
          await connect();
          return;
        }
      }

      // Fall back to single server add
      let hostname: string;
      try {
        hostname = new URL(trimmedUrl).hostname;
      } catch {
        hostname = trimmedUrl;
      }

      const server = {
        id: `custom-${uuid()}`,
        name: hostname,
        title: hostname,
        description: "Custom server",
        url: trimmedUrl,
        transportType,
      };

      addCustomServer(server);
      select(server.id);
      setFromPredefined(server);
      setRawJson("");
      await connect();
    } finally {
      setIsAdding(false);
    }
  }, [
    url,
    transportType,
    addCustomServer,
    select,
    setFromPredefined,
    setRawJson,
    setUrl,
    connect,
  ]);

  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        url.trim() &&
        connectionStatus !== "connecting"
      ) {
        if (showAddButton) {
          handleAdd();
        } else {
          handleConnect();
        }
      }
    },
    [url, connectionStatus, showAddButton, handleAdd, handleConnect],
  );

  const statusColor = {
    disconnected: "bg-muted",
    connecting: "bg-warning",
    connected: "bg-success",
    error: "bg-destructive",
  }[connectionStatus];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">
          Connection
        </h3>
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${statusColor}`} />
          <span className="text-[10px] text-muted-foreground capitalize">
            {connectionStatus}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Input
            placeholder="MCP Server or ORD URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            className="h-8 text-xs flex-1"
          />
          {showAddButton && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleAdd}
              disabled={isAdding}
              title="Add server to list"
            >
              {isAdding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>

        <Select
          value={transportType}
          onValueChange={(v) =>
            setTransportType(v as "streamable-http" | "sse")
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="streamable-http">Streamable HTTP</SelectItem>
            <SelectItem value="sse">SSE</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={connAuthType}
          onValueChange={(v) => setManualAuthType(v as ConnAuthType)}
        >
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
              className="h-8 text-xs"
              autoComplete="off"
            />
            <PasswordInput
              placeholder="Password"
              value={effectivePassword}
              onChange={(e) => setLocalPassword(e.target.value)}
              className="h-8 text-xs"
              autoComplete="off"
            />
          </div>
        )}

        {connAuthType === "bearer" && (
          <PasswordInput
            placeholder="Bearer Token"
            value={effectiveToken}
            onChange={(e) => setLocalToken(e.target.value)}
            className="h-8 text-xs"
            autoComplete="off"
          />
        )}

        <div className="flex gap-2">
          {connectionStatus === "connected" ||
          (connectionStatus === "connecting" && serverInfo) ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => disconnect()}
              disabled={connectionStatus === "connecting"}
            >
              {connectionStatus === "connecting" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Unplug className="h-4 w-4 mr-1" />
              )}
              {connectionStatus === "connecting" ? "Connecting…" : "Disconnect"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleConnect}
              disabled={!url || connectionStatus === "connecting"}
            >
              {connectionStatus === "connecting" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Plug className="h-4 w-4 mr-1" />
              )}
              Connect
            </Button>
          )}
        </div>

        {errorMessage && (
          <p className="text-xs text-destructive">{errorMessage}</p>
        )}

        {serverInfo && (
          <div
            className={cn(
              "rounded-md border p-3 space-y-1 transition-opacity",
              connectionStatus === "connecting" && "opacity-50",
            )}
          >
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
