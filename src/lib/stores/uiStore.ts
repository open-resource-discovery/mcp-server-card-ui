import { create } from "zustand";
import { useFunctionsStore } from "./functionsStore";
import { useMCPLogStore } from "./mcpLogStore";

type ActiveTab = "overview" | "functions" | "rawhttp" | "validation";
type MobileView = "card" | "editor" | "settings";

interface UIState {
  settingsPanelOpen: boolean;
  validationPanelOpen: boolean;
  activeTab: ActiveTab;
  mobileView: MobileView;

  setSettingsPanelOpen: (open: boolean) => void;
  setValidationPanelOpen: (open: boolean) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setMobileView: (view: MobileView) => void;
  closeAllPanels: () => void;
  switchToFunctions: (toolName?: string) => void;
  switchToPrompt: (promptName?: string) => void;
  switchToRawHttp: (logId?: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  settingsPanelOpen: false,
  validationPanelOpen: false,
  activeTab: "overview",
  mobileView: "card",

  setSettingsPanelOpen: (open) => set({ settingsPanelOpen: open }),
  setValidationPanelOpen: (open) => set({ validationPanelOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setMobileView: (view) => set({ mobileView: view }),
  closeAllPanels: () =>
    set({ settingsPanelOpen: false, validationPanelOpen: false }),

  switchToFunctions: (toolName?: string) => {
    set({ activeTab: "functions" });
    if (toolName) {
      useFunctionsStore.getState().setSelectedToolName(toolName);
      useFunctionsStore.getState().setSelectedPromptName(null);
      useFunctionsStore.getState().requestPrefill();
    }
  },

  switchToPrompt: (promptName?: string) => {
    set({ activeTab: "functions" });
    if (promptName) {
      useFunctionsStore.getState().setSelectedPromptName(promptName);
      useFunctionsStore.getState().setSelectedToolName(null);
      useFunctionsStore.getState().requestPrefill();
    }
  },

  switchToRawHttp: (logId?: string) => {
    set({ activeTab: "rawhttp" });
    if (logId) {
      useMCPLogStore.getState().highlightLog(logId);
    }
  },
}));
