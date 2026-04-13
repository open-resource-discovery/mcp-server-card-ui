import { Panel, Group as PanelGroup, Separator } from "react-resizable-panels";
import { GripVertical } from "lucide-react";
import { useIsLargeScreen } from "@lib/hooks/useMediaQuery";
import { useUIStore } from "@lib/stores/uiStore";
import { useAutoValidate } from "@lib/hooks/useAutoValidate";
import { TextareaEditor } from "@lib/components/editor/TextareaEditor";
import { useServerCardStore } from "@lib/stores/serverCardStore";
import { ViewerRightPanel } from "./ViewerRightPanel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@lib/components/ui/sheet";
import { cn } from "@lib/utils/cn";

interface ViewerLayoutProps {
  showValidation?: boolean;
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

export function ViewerLayout({
  showValidation = true,
  defaultTab = "overview",
  className,
}: ViewerLayoutProps) {
  const isLargeScreen = useIsLargeScreen();
  const { rawJson, setRawJson } = useServerCardStore();
  const { validationPanelOpen, setValidationPanelOpen, closeAllPanels } =
    useUIStore();

  useAutoValidate();

  if (isLargeScreen && validationPanelOpen) {
    closeAllPanels();
  }

  if (isLargeScreen) {
    return (
      <div className={cn("h-full", className)}>
        <PanelGroup orientation="horizontal">
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full border-r">
              <TextareaEditor value={rawJson} onChange={setRawJson} />
            </div>
          </Panel>
          <ResizeHandle />
          <Panel defaultSize={50} minSize={20}>
            <ViewerRightPanel
              showValidation={showValidation}
              defaultTab={defaultTab}
            />
          </Panel>
        </PanelGroup>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="min-h-0 flex-1">
        <TextareaEditor value={rawJson} onChange={setRawJson} />
      </div>
      <Sheet open={validationPanelOpen} onOpenChange={setValidationPanelOpen}>
        <SheetContent side="bottom" className="h-[70vh] max-h-[600px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Overview & Validation</SheetTitle>
          </SheetHeader>
          <ViewerRightPanel
            showValidation={showValidation}
            defaultTab={defaultTab}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
