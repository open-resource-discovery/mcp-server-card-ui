import { useEffect } from "react";
import { usePredefinedServersStore } from "@lib/stores/predefinedServersStore";
import { useMCPConnectionStore } from "@lib/stores/mcpConnectionStore";
import { useServerCardStore } from "@lib/stores/serverCardStore";
import { Badge } from "@lib/components/ui/badge";
import { cn } from "@lib/utils/cn";
import { getMockServerCard } from "@lib/mock/servers";
import { Loader2 } from "lucide-react";

function getHostname(url: string): string {
  if (url.startsWith("mock://")) return url;
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function MCPServerSelector() {
  const servers = usePredefinedServersStore((s) => s.servers);
  const selectedId = usePredefinedServersStore((s) => s.selectedId);
  const loading = usePredefinedServersStore((s) => s.loading);
  const loadDefaults = usePredefinedServersStore((s) => s.loadDefaults);
  const select = usePredefinedServersStore((s) => s.select);
  const { setFromPredefined, connect } = useMCPConnectionStore();
  const { setRawJson } = useServerCardStore();

  useEffect(() => {
    loadDefaults();
  }, [loadDefaults]);

  // Auto-select the first server after loading defaults (if nothing is selected)
  useEffect(() => {
    if (!loading && servers.length > 0 && !selectedId) {
      handleSelect(servers[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, servers, selectedId]);

  const handleSelect = async (id: string) => {
    const server = servers.find((s) => s.id === id);
    if (!server) return;

    select(id);
    setFromPredefined(server);

    if (server.serverCard) {
      setRawJson(server.serverCard);
    } else if (server.mocked && server.url.startsWith("mock://")) {
      const mockId = server.url.replace("mock://", "");
      const card = getMockServerCard(mockId);
      if (card) setRawJson(card);
    }

    await connect();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
        <span className="text-xs">Loading servers…</span>
      </div>
    );
  }

  if (servers.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-medium text-muted-foreground">Servers</h3>
      <div className="space-y-1" role="list">
        {servers.map((server) => (
          <div
            key={server.id}
            role="listitem"
            tabIndex={0}
            aria-selected={selectedId === server.id}
            className={cn(
              "cursor-pointer rounded-md border px-2.5 py-2 transition-colors hover:bg-accent/50",
              selectedId === server.id && "border-primary bg-accent/30",
            )}
            onClick={() => handleSelect(server.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSelect(server.id);
              }
            }}
          >
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium truncate flex-1">{server.title || server.name}</p>
              {server.mocked && (
                <Badge variant="outline" className="text-[9px] h-3.5 border-warning/50 text-warning shrink-0">
                  Mock
                </Badge>
              )}
              {server.tags?.slice(0, 1).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[9px] h-3.5 shrink-0">
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{getHostname(server.url)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
