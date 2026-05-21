import { SplitPane } from "@open-resource-discovery/ui-components";
import { useIsLargeScreen } from "@lib/hooks/useMediaQuery";
import { useUIStore } from "@lib/stores/uiStore";
import { useAutoValidate } from "@lib/hooks/useAutoValidate";
import { ServerCardEditor } from "@lib/components/editor/ServerCardEditor";
import { EditorRightPanel } from "./EditorRightPanel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@lib/components/ui/sheet";
import { cn } from "@lib/utils/cn";

interface EditorLayoutProps {
  showValidation?: boolean;
  showSettings?: boolean;
  readOnly?: boolean;
  defaultTab?: "overview" | "validation";
  className?: string;
}

function ResizeHandle() {
  return <SplitPane.Handle />;
}

export function EditorLayout({
  showValidation = true,
  readOnly = false,
  defaultTab = "overview",
  className,
}: EditorLayoutProps) {
  const isLargeScreen = useIsLargeScreen();
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
            <ServerCardEditor readOnly={readOnly} />
          </SplitPane.Panel>
          <ResizeHandle />
          <SplitPane.Panel defaultSize={50} minSize={20}>
            <EditorRightPanel
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
        <ServerCardEditor readOnly={readOnly} />
      </div>
      <Sheet open={validationPanelOpen} onOpenChange={setValidationPanelOpen}>
        <SheetContent side="bottom" className="h-[70vh] max-h-[600px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Overview & Validation</SheetTitle>
          </SheetHeader>
          <EditorRightPanel
            showValidation={showValidation}
            defaultTab={defaultTab}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
