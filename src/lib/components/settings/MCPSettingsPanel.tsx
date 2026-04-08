import { ScrollArea } from "@lib/components/ui/scroll-area";
import { MCPConnectionSettings } from "./MCPConnectionSettings";
import { MCPServerSelector } from "@lib/components/MCPServerSelector";
import { Separator } from "@lib/components/ui/separator";

export function MCPSettingsPanel() {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-10 flex-none items-center border-b bg-muted/30 px-3">
        <span className="text-xs font-medium text-muted-foreground">Settings</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <MCPServerSelector />
          <Separator />
          <MCPConnectionSettings />
          <Separator />
          <div className="text-xs text-muted-foreground">
            Configure connection settings to test your MCP server.
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
