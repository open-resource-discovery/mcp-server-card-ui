import { lazy, Suspense } from "react";
import { SplitPane } from "@open-resource-discovery/ui-components";
import { useIsLargeScreen } from "@lib/hooks/useMediaQuery";
import { useUIStore } from "@lib/stores/uiStore";
import { useAutoValidate } from "@lib/hooks/useAutoValidate";
import { ServerCardEditor } from "@lib/components/editor/ServerCardEditor";
import { MCPRightPanel } from "@lib/components/MCPRightPanel";
import { MobileBottomBar } from "@lib/components/MobileBottomBar";
import { ResizeHandle } from "@lib/components/layouts/ResizeHandle";
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
        <SplitPane.Root orientation="horizontal" className="h-full">
          {showSettings && (
            <>
              <SplitPane.Panel
                defaultSize={20}
                minSize={15}
                collapsible
                collapsedSize={0}
              >
                <Suspense fallback={<SettingsPanelFallback />}>
                  <MCPSettingsPanel />
                </Suspense>
              </SplitPane.Panel>
              <ResizeHandle />
            </>
          )}
          <SplitPane.Panel defaultSize={showSettings ? 45 : 55} minSize={30}>
            <ServerCardEditor readOnly={readOnly} />
          </SplitPane.Panel>
          <ResizeHandle />
          <SplitPane.Panel defaultSize={showSettings ? 35 : 45} minSize={20}>
            <MCPRightPanel
              showFunctions={showFunctions}
              showValidation={showValidation}
              showRawHttp={showRawHttp}
              defaultTab={defaultTab}
            />
          </SplitPane.Panel>
        </SplitPane.Root>
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
