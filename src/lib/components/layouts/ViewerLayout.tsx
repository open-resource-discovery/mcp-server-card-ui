import { SplitPane } from "@open-resource-discovery/ui-components";
import { useIsLargeScreen } from "@lib/hooks/useMediaQuery";
import { useUIStore } from "@lib/stores/uiStore";
import { useAutoValidate } from "@lib/hooks/useAutoValidate";
import { TextareaEditor } from "@lib/components/editor/TextareaEditor";
import { useServerCardStore } from "@lib/stores/serverCardStore";
import { ViewerRightPanel } from "./ViewerRightPanel";
import { ResizeHandle } from "./ResizeHandle";
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
        <SplitPane.Root orientation="horizontal">
          <SplitPane.Panel defaultSize={50} minSize={30}>
            <div className="h-full border-r">
              <TextareaEditor value={rawJson} onChange={setRawJson} />
            </div>
          </SplitPane.Panel>
          <ResizeHandle />
          <SplitPane.Panel defaultSize={50} minSize={20}>
            <ViewerRightPanel
              showValidation={showValidation}
              defaultTab={defaultTab}
            />
          </SplitPane.Panel>
        </SplitPane.Root>
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
