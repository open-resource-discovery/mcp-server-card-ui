import { MCPServerSelector } from "@lib/components/MCPServerSelector";
import { ScrollArea } from "@lib/components/ui/scroll-area";
import { Separator } from "@lib/components/ui/separator";
import { MCPConnectionSettings } from "./MCPConnectionSettings";

export function MCPSettingsPanel() {
  return (
    <div
      className="flex h-full flex-col bg-sidebar"
      data-testid="settings-panel"
    >
      <div className="flex h-10 flex-none items-center border-b bg-muted/30 px-3">
        <span className="text-xs font-medium text-muted-foreground">
          Settings
        </span>
      </div>

      {/* Connection settings (URL, transport, auth, connect) */}
      <div className="flex-none p-3">
        <MCPConnectionSettings />
      </div>

      <Separator />

      {/* Scrollable server list */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3">
          <MCPServerSelector />
        </div>
      </ScrollArea>
    </div>
  );
}
