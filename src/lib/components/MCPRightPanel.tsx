import { ScrollArea } from "@lib/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@lib/components/ui/tabs";
import { MCPServerOverview } from "@lib/components/overview/MCPServerOverview";
import { FunctionsPanel } from "@lib/components/functions/FunctionsPanel";
import { MCPLogPanel } from "@lib/components/rawhttp/MCPLogPanel";
import { ValidationPanel } from "@lib/components/validation/ValidationPanel";
import { useValidationStore } from "@lib/stores/validationStore";
import { useFunctionsStore } from "@lib/stores/functionsStore";
import { useMCPLogStore } from "@lib/stores/mcpLogStore";
import { useUIStore } from "@lib/stores/uiStore";
import { Badge } from "@lib/components/ui/badge";
import { useEffect } from "react";

interface MCPRightPanelProps {
  showFunctions?: boolean;
  showRawHttp?: boolean;
  showValidation?: boolean;
  defaultTab?: "overview" | "functions" | "rawhttp" | "validation";
}

export function MCPRightPanel({
  showFunctions = true,
  showRawHttp = true,
  showValidation = true,
  defaultTab = "overview",
}: MCPRightPanelProps) {
  const summary = useValidationStore((s) => s.summary);
  const callCount = useFunctionsStore((s) => s.calls.length);
  const logCount = useMCPLogStore((s) => s.logs.length);
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  // Sync store tab with controlled Tabs
  useEffect(() => {
    if (activeTab !== defaultTab) {
      // External tab switch (e.g., from "Try it" button)
    }
  }, [activeTab, defaultTab]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      className="flex h-full flex-col"
    >
      <div className="flex-none border-b px-4 bg-background">
        <TabsList className="h-10">
          <TabsTrigger value="overview" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          {showFunctions && (
            <TabsTrigger
              value="functions"
              className="flex items-center gap-1.5"
              data-testid="tab-functions"
            >
              Tools
              {callCount > 0 && (
                <Badge variant="outline" className="h-5 min-w-5 px-1 text-xs">
                  {callCount}
                </Badge>
              )}
            </TabsTrigger>
          )}
          {showRawHttp && (
            <TabsTrigger
              value="rawhttp"
              className="flex items-center gap-1.5"
              data-testid="tab-rawhttp"
            >
              Raw HTTP
              {logCount > 0 && (
                <Badge variant="outline" className="h-5 min-w-5 px-1 text-xs">
                  {logCount}
                </Badge>
              )}
            </TabsTrigger>
          )}
          {showValidation && (
            <TabsTrigger
              value="validation"
              className="flex items-center gap-1.5"
              data-testid="tab-validation"
            >
              Validation
              {summary.fail > 0 && (
                <Badge
                  variant="destructive"
                  className="h-5 min-w-5 px-1 text-xs"
                >
                  {summary.fail}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>
      </div>

      <TabsContent value="overview" className="flex-1 overflow-hidden m-0">
        <ScrollArea className="h-full">
          <MCPServerOverview />
        </ScrollArea>
      </TabsContent>

      {showFunctions && (
        <TabsContent value="functions" className="flex-1 overflow-hidden m-0">
          <FunctionsPanel />
        </TabsContent>
      )}

      {showRawHttp && (
        <TabsContent value="rawhttp" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <MCPLogPanel />
          </ScrollArea>
        </TabsContent>
      )}

      {showValidation && (
        <TabsContent value="validation" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <ValidationPanel />
          </ScrollArea>
        </TabsContent>
      )}
    </Tabs>
  );
}
