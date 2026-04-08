import { Panel, Group as PanelGroup, Separator } from "react-resizable-panels";
import { GripVertical } from "lucide-react";
import { useIsLargeScreen } from "@lib/hooks/useMediaQuery";
import { useUIStore } from "@lib/stores/uiStore";
import { useAutoValidate } from "@lib/hooks/useAutoValidate";
import { ServerCardEditor } from "@lib/components/editor/ServerCardEditor";
import { EditorRightPanel } from "./EditorRightPanel";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@lib/components/ui/sheet";
import { cn } from "@lib/utils/cn";

interface EditorLayoutProps {
  showValidation?: boolean;
  showSettings?: boolean;
  readOnly?: boolean;
  defaultTab?: "overview" | "validation";
  className?: string;
}

function ResizeHandle() {
  return (
    <Separator className="group relative flex w-2 items-center justify-center bg-border/50 transition-colors hover:bg-border">
      <div className="absolute z-10 flex h-8 w-4 items-center justify-center rounded-sm bg-border opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
    </Separator>
  );
}

export function EditorLayout({
  showValidation = true,
  readOnly = false,
  defaultTab = "overview",
  className,
}: EditorLayoutProps) {
  const isLargeScreen = useIsLargeScreen();
  const { validationPanelOpen, setValidationPanelOpen, closeAllPanels } = useUIStore();

  useAutoValidate();

  if (isLargeScreen && validationPanelOpen) {
    closeAllPanels();
  }

  if (isLargeScreen) {
    return (
      <div className={cn("h-full", className)}>
        <PanelGroup orientation="horizontal">
          <Panel defaultSize={50} minSize={30}>
            <ServerCardEditor readOnly={readOnly} />
          </Panel>
          <ResizeHandle />
          <Panel defaultSize={50} minSize={20}>
            <EditorRightPanel showValidation={showValidation} defaultTab={defaultTab} />
          </Panel>
        </PanelGroup>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="min-h-0 flex-1">
        <ServerCardEditor readOnly={readOnly} />
      </div>
      <Sheet open={validationPanelOpen} onOpenChange={setValidationPanelOpen}>
        <SheetContent side="bottom" className="h-[70vh] max-h-[600px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Overview & Validation</SheetTitle>
          </SheetHeader>
          <EditorRightPanel showValidation={showValidation} defaultTab={defaultTab} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
