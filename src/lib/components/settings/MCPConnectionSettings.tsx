import { useState, useCallback, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { useMCPConnectionStore } from "@lib/stores/mcpConnectionStore";
import { useServerCardStore } from "@lib/stores/serverCardStore";
import { usePredefinedServersStore } from "@lib/stores/predefinedServersStore";
import { Input } from "@lib/components/ui/input";
import { PasswordInput } from "@lib/components/ui/PasswordInput";
import { Button } from "@lib/components/ui/button";
import { Select } from "@lib/components/ui/select";
import { Loader2, Plug, Plus, Unplug } from "lucide-react";
import {
  type ConnAuthType,
  mapStoreAuthType,
} from "@lib/utils/connection-auth";
import { cn } from "@lib/utils/cn";
import {
  discoverServersFromOrd,
  formatOrdDiscoveryIssue,
  isOrdUrl,
} from "@lib/utils/ord-discovery";

export function MCPConnectionSettings() {
  const {
    url: activeUrl,
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
  const { parsedCard, reset } = useServerCardStore();
  const servers = usePredefinedServersStore((s) => s.servers);
  const addCustomServer = usePredefinedServersStore((s) => s.addCustomServer);
  const select = usePredefinedServersStore((s) => s.select);
  const notice = usePredefinedServersStore((s) => s.notice);
  const setNotice = usePredefinedServersStore((s) => s.setNotice);
  const isAdding = usePredefinedServersStore((s) => s.isAddingServer);
  const setIsAdding = usePredefinedServersStore((s) => s.setIsAddingServer);

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
  const [inputUrl, setInputUrl] = useState(activeUrl);

  useEffect(() => {
    setManualAuthType(null);
    setLocalUsername(null);
    setLocalPassword(null);
    setLocalToken(null);
  }, [storeAuthType]);

  useEffect(() => {
    setInputUrl(activeUrl);
  }, [activeUrl]);

  const trimmedInputUrl = inputUrl.trim();
  const urlMatchesServer = servers.some((s) => s.url === trimmedInputUrl);
  const showAddButton = trimmedInputUrl.length > 0 && !urlMatchesServer;

  const handleConnect = useCallback(async () => {
    const requestedUrl = inputUrl.trim();
    if (!requestedUrl) return;
    setUrl(requestedUrl);

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
    inputUrl,
    setUrl,
    connect,
    parsedCard,
    autoConfigureAuth,
  ]);

  const handleAdd = useCallback(async () => {
    const trimmedUrl = inputUrl.trim();
    if (!trimmedUrl) return;

    if (useMCPConnectionStore.getState().connectionStatus === "connecting") {
      setNotice({
        severity: "error",
        summary:
          "The server cannot be added while a connection is in progress.",
        details: [
          "Wait for the current connection attempt to finish and retry.",
        ],
      });
      return;
    }

    setNotice(null);
    setIsAdding(true);
    try {
      // Try ORD discovery first if the URL looks like an ORD endpoint
      if (isOrdUrl(trimmedUrl)) {
        const result = await discoverServersFromOrd(trimmedUrl, "custom-");
        const discovered = result.servers;
        const details = result.issues.map(formatOrdDiscoveryIssue);
        if (discovered.length === 0) {
          setNotice({
            severity: "error",
            summary: "ORD discovery failed. No MCP servers were added.",
            details,
          });
          return;
        }

        const addedServers = [];
        const additionIssues = [...details];
        for (const server of discovered) {
          const addition = addCustomServer(server);
          additionIssues.push(...addition.issues);
          if (addition.status === "added") {
            addedServers.push(addition.server);
          }
        }

        if (addedServers.length === 0) {
          setNotice({
            severity: "warning",
            summary: "No new MCP servers were added.",
            details: additionIssues,
          });
          return;
        }

        if (additionIssues.length > 0) {
          setNotice({
            severity: "warning",
            summary: `Added ${addedServers.length} of ${discovered.length} discovered MCP ${discovered.length === 1 ? "server" : "servers"} with ${additionIssues.length} ${additionIssues.length === 1 ? "warning" : "warnings"}.`,
            details: additionIssues,
          });
        } else {
          setNotice(null);
        }

        // Select and connect to the first discovered server
        const first = addedServers[0];
        const currentConnection = useMCPConnectionStore.getState();
        if (currentConnection.connectionStatus === "connecting") {
          setNotice({
            severity: "warning",
            summary:
              "Servers were discovered, but automatic connection was skipped.",
            details: [
              ...additionIssues,
              "Another connection attempt is still in progress. Select the discovered server after it finishes.",
            ],
          });
          return;
        }
        if (
          currentConnection.connectionStatus === "connected" ||
          currentConnection.connectionStatus === "error"
        ) {
          await currentConnection.disconnect();
        }
        select(first.id);
        setFromPredefined(first);
        setInputUrl(first.url);
        reset();
        await connect();
        return;
      }

      // Fall back to single server add
      let hostname: string;
      try {
        hostname = new URL(trimmedUrl).hostname || trimmedUrl;
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

      const addition = addCustomServer(server);
      if (addition.status !== "added") return;
      const addedServer = addition.server;
      const currentConnection = useMCPConnectionStore.getState();
      if (currentConnection.connectionStatus === "connecting") {
        setNotice({
          severity: "warning",
          summary:
            "The server was added, but automatic connection was skipped.",
          details: [
            "Another connection attempt is still in progress. Select the new server after it finishes.",
          ],
        });
        return;
      }
      if (
        currentConnection.connectionStatus === "connected" ||
        currentConnection.connectionStatus === "error"
      ) {
        await currentConnection.disconnect();
      }
      select(addedServer.id);
      setFromPredefined(addedServer);
      setInputUrl(addedServer.url);
      reset();
      await connect();
    } finally {
      setIsAdding(false);
    }
  }, [
    inputUrl,
    transportType,
    addCustomServer,
    select,
    setNotice,
    setIsAdding,
    setFromPredefined,
    reset,
    connect,
  ]);

  const handleUrlKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        trimmedInputUrl &&
        !isAdding &&
        connectionStatus !== "connecting"
      ) {
        if (showAddButton) {
          await handleAdd();
          return;
        }

        const server = servers.find((s) => s.url === trimmedInputUrl);
        if (!server) return;
        const currentConnection = useMCPConnectionStore.getState();
        if (
          currentConnection.connectionStatus === "connected" &&
          activeUrl === server.url
        ) {
          return;
        }
        if (currentConnection.connectionStatus === "connecting") return;
        if (
          currentConnection.connectionStatus === "connected" ||
          currentConnection.connectionStatus === "error"
        ) {
          await currentConnection.disconnect();
        }
        select(server.id);
        setFromPredefined(server);
        reset();
        await connect();
      }
    },
    [
      activeUrl,
      trimmedInputUrl,
      isAdding,
      connectionStatus,
      showAddButton,
      handleAdd,
      select,
      setFromPredefined,
      reset,
      servers,
      connect,
    ],
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
        <div
          className="flex items-center gap-1.5"
          data-testid="connection-status"
        >
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
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            disabled={isAdding}
            className="h-8 text-xs flex-1"
            data-testid="connection-url"
          />
          {showAddButton && (
            <Button
              data-testid="add-server-btn"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleAdd}
              disabled={isAdding || connectionStatus === "connecting"}
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

        <Select.Root
          value={transportType}
          disabled={isAdding}
          onValueChange={(v) =>
            setTransportType(v as "streamable-http" | "sse")
          }
        >
          <Select.Trigger
            className="h-8 text-xs"
            data-testid="transport-type-select"
          >
            <Select.Value />
            <Select.Icon />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="streamable-http">
                  <Select.ItemIndicator />
                  <Select.ItemText>Streamable HTTP</Select.ItemText>
                </Select.Item>
                <Select.Item value="sse">
                  <Select.ItemIndicator />
                  <Select.ItemText>SSE</Select.ItemText>
                </Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>

        <Select.Root
          value={connAuthType}
          disabled={isAdding}
          onValueChange={(v) => setManualAuthType(v as ConnAuthType)}
        >
          <Select.Trigger
            className="h-8 text-xs"
            data-testid="auth-type-select"
          >
            <Select.Value />
            <Select.Icon />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="none">
                  <Select.ItemIndicator />
                  <Select.ItemText>No Authentication</Select.ItemText>
                </Select.Item>
                <Select.Item value="basic">
                  <Select.ItemIndicator />
                  <Select.ItemText>Basic Auth</Select.ItemText>
                </Select.Item>
                <Select.Item value="bearer">
                  <Select.ItemIndicator />
                  <Select.ItemText>Bearer Token</Select.ItemText>
                </Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>

        {connAuthType === "basic" && (
          <div className="space-y-2">
            <Input
              placeholder="Username"
              value={effectiveUsername}
              onChange={(e) => setLocalUsername(e.target.value)}
              className="h-8 text-xs"
              autoComplete="off"
              data-testid="basic-auth-username"
            />
            <PasswordInput
              placeholder="Password"
              value={effectivePassword}
              onChange={(e) => setLocalPassword(e.target.value)}
              className="h-8 text-xs"
              autoComplete="off"
              data-testid="basic-auth-password"
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
            data-testid="bearer-token"
          />
        )}

        <div className="flex gap-2">
          {connectionStatus === "connected" ||
          (connectionStatus === "connecting" && serverInfo) ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => disconnect()}
              disabled={isAdding || connectionStatus === "connecting"}
              data-testid="disconnect-btn"
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
              disabled={
                isAdding ||
                !trimmedInputUrl ||
                connectionStatus === "connecting"
              }
              data-testid="connect-btn"
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
          <p className="text-xs text-destructive" role="alert">
            {errorMessage}
          </p>
        )}

        {notice && (
          <div
            className={cn(
              "rounded-md border px-3 py-2 text-xs",
              notice.severity === "error"
                ? "border-destructive/40 bg-destructive/10"
                : "border-warning/40 bg-warning/10",
            )}
            role="alert"
            data-testid="server-load-notice"
          >
            <p
              className={cn(
                "font-medium",
                notice.severity === "error"
                  ? "text-destructive"
                  : "text-warning",
              )}
            >
              {notice.summary}
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">
              {notice.details.map((detail, index) => (
                <li key={`${index}-${detail}`}>{detail}</li>
              ))}
            </ul>
          </div>
        )}

        {serverInfo && (
          <div
            className={cn(
              "rounded-md border p-3 space-y-1 transition-opacity",
              connectionStatus === "connecting" && "opacity-50",
            )}
            data-testid="server-info"
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
