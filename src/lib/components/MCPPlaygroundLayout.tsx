import { lazy, Suspense } from "react";
import { Panel, Group as PanelGroup, Separator } from "react-resizable-panels";
import { GripVertical } from "lucide-react";
import { useIsLargeScreen } from "@lib/hooks/useMediaQuery";
import { useUIStore } from "@lib/stores/uiStore";
import { useAutoValidate } from "@lib/hooks/useAutoValidate";
import { ServerCardEditor } from "@lib/components/editor/ServerCardEditor";
import { MCPRightPanel } from "@lib/components/MCPRightPanel";
import { MobileBottomBar } from "@lib/components/MobileBottomBar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@lib/components/ui/sheet";
import { cn } from "@lib/utils/cn";

const MCPSettingsPanel = lazy(() =>
  import("@lib/components/settings/MCPSettingsPanel").then((m) => ({
    default: m.MCPSettingsPanel,
  })),
);

function SettingsPanelFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-sidebar">
      <div className="text-sm text-muted-foreground">Loading...</div>
    </div>
  );
}

interface MCPPlaygroundLayoutProps {
  showSettings?: boolean;
  showValidation?: boolean;
  showFunctions?: boolean;
  showRawHttp?: boolean;
  showEditor?: boolean;
  readOnly?: boolean;
  defaultTab?: "overview" | "functions" | "rawhttp" | "validation";
  forceDesktop?: boolean;
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

export function MCPPlaygroundLayout({
  showSettings = true,
  showValidation = true,
  showFunctions = true,
  showRawHttp = true,
  showEditor = true,
  readOnly = false,
  defaultTab = "overview",
  forceDesktop = false,
  className,
}: MCPPlaygroundLayoutProps) {
  const isLargeScreen = useIsLargeScreen();
  const useDesktopLayout = forceDesktop || isLargeScreen;
  const { settingsPanelOpen, setSettingsPanelOpen, mobileView } = useUIStore();

  useAutoValidate();

  // Viewer-only mode
  if (!showEditor) {
    return (
      <div className={cn("h-full", className)}>
        <MCPRightPanel
          showFunctions={showFunctions}
          showValidation={showValidation}
          showRawHttp={showRawHttp}
          defaultTab={defaultTab}
        />
      </div>
    );
  }

  if (useDesktopLayout) {
    return (
      <div className={cn("h-full overflow-hidden", className)}>
        <PanelGroup orientation="horizontal" className="h-full">
          {showSettings && (
            <>
              <Panel
                defaultSize={20}
                minSize={15}
                collapsible
                collapsedSize={0}
              >
                <Suspense fallback={<SettingsPanelFallback />}>
                  <MCPSettingsPanel />
                </Suspense>
              </Panel>
              <ResizeHandle />
            </>
          )}
          <Panel defaultSize={showSettings ? 45 : 55} minSize={30}>
            <ServerCardEditor readOnly={readOnly} />
          </Panel>
          <ResizeHandle />
          <Panel defaultSize={showSettings ? 35 : 45} minSize={20}>
            <MCPRightPanel
              showFunctions={showFunctions}
              showValidation={showValidation}
              showRawHttp={showRawHttp}
              defaultTab={defaultTab}
            />
          </Panel>
        </PanelGroup>
      </div>
    );
  }

  // Mobile layout
  const renderMobileContent = () => {
    switch (mobileView) {
      case "card":
        return (
          <MCPRightPanel
            showFunctions={showFunctions}
            showValidation={showValidation}
            showRawHttp={showRawHttp}
            defaultTab={defaultTab}
          />
        );
      case "editor":
        return <ServerCardEditor readOnly={readOnly} />;
      case "settings":
      default:
        return (
          <MCPRightPanel
            showFunctions={showFunctions}
            showValidation={showValidation}
            showRawHttp={showRawHttp}
            defaultTab={defaultTab}
          />
        );
    }
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="min-h-0 flex-1 overflow-hidden">
        {renderMobileContent()}
      </div>
      <MobileBottomBar showSettings={showSettings} />

      {showSettings && (
        <Sheet open={settingsPanelOpen} onOpenChange={setSettingsPanelOpen}>
          <SheetContent side="left" className="w-[85%] max-w-md p-0">
            <SheetHeader>
              <SheetTitle>Settings</SheetTitle>
            </SheetHeader>
            <Suspense fallback={<SettingsPanelFallback />}>
              <MCPSettingsPanel />
            </Suspense>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
