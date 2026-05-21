import { ScrollArea } from "@lib/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@lib/components/ui/tabs";
import { MCPServerOverview } from "@lib/components/overview/MCPServerOverview";
import { ValidationPanel } from "@lib/components/validation/ValidationPanel";
import { useValidationStore } from "@lib/stores/validationStore";
import { Badge } from "@lib/components/ui/badge";

interface EditorRightPanelProps {
  showValidation?: boolean;
  defaultTab?: "overview" | "validation";
}

export function EditorRightPanel({
  showValidation = true,
  defaultTab = "overview",
}: EditorRightPanelProps) {
  const summary = useValidationStore((s) => s.summary);

  return (
    <Tabs defaultValue={defaultTab} className="flex h-full flex-col">
      <div className="flex-none border-b px-4">
        <TabsList className="h-10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {showValidation && (
            <TabsTrigger
              value="validation"
              className="flex items-center gap-1.5"
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
