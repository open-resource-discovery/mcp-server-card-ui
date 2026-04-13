import { ScrollArea } from "@lib/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@lib/components/ui/tabs";
import { MCPServerOverview } from "@lib/components/overview/MCPServerOverview";
import { ValidationPanel } from "@lib/components/validation/ValidationPanel";
import { useAutoValidate } from "@lib/hooks/useAutoValidate";
import { cn } from "@lib/utils/cn";

interface CardViewLayoutProps {
  showValidation?: boolean;
  defaultTab?: "overview" | "validation";
  readOnly?: boolean;
  className?: string;
}

export function CardViewLayout({
  showValidation = true,
  defaultTab = "overview",
  readOnly = false,
  className,
}: CardViewLayoutProps) {
  useAutoValidate();

  if (!showValidation) {
    return (
      <ScrollArea className={cn("h-full", className)}>
        <MCPServerOverview readOnly={readOnly} />
      </ScrollArea>
    );
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <Tabs defaultValue={defaultTab} className="flex h-full flex-col">
        <div className="flex-none border-b px-4">
          <TabsList className="h-10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <MCPServerOverview readOnly={readOnly} />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="validation" className="flex-1 overflow-hidden m-0">
          <ValidationPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
