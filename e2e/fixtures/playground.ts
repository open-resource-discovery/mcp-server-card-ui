import { type Page, type Locator, expect } from "@playwright/test";
import { test as base } from "@playwright/test";

export const CONNECTION_TIMEOUT = 15000;
//export const COMPONENT_TIMEOUT = 15000;

export class PlaygroundPage {
  // Editor

  readonly page: Page;
  readonly isDocusaurus: boolean;

  // Settings panel
  readonly settingsPanel: Locator;

  // Editor
  readonly editorPanel: Locator;

  readonly toolbarFormat: Locator;
  readonly toolbarCopy: Locator;
  //readonly toolbarValidate: Locator;
  readonly toolbarReset: Locator;
  readonly editorParseError: Locator;

  // Right panel tabs
  readonly tabOverview: Locator;
  readonly tabFunctions: Locator;
  readonly tabRawHttp: Locator;
  readonly tabValidation: Locator;

  //Overview
  readonly serverName: Locator;
  readonly serverVersion: Locator;

  // Overview sections
  readonly remotesSection: Locator;
  readonly capabilitiesSection: Locator;
  readonly toolsSection: Locator;
  readonly resourcesSection: Locator;
  readonly promptsSection: Locator;

  // Connection
  readonly connectionUrl: Locator;
  readonly connectBtn: Locator;
  readonly disconnectBtn: Locator;
  readonly connectionStatus: Locator;
  readonly addServerBtn: Locator;

  // Authtype and connection settings
  readonly transportTypeSelect: Locator;
  readonly authTypeSelect: Locator;
  readonly basicAuthUsername: Locator;
  readonly basicAuthPassword: Locator;
  readonly bearerToken: Locator;
  readonly serverInfo: Locator;
  readonly executeButton: Locator;

  // Raw HTTP log
  readonly logPanel: Locator;
  readonly logEmptyState: Locator;
  readonly logList: Locator;
  readonly logClearBtn: Locator;

  // Validation
  readonly validationPanel: Locator;
  readonly validationSummary: Locator;
  readonly validationResultsList: Locator;
  readonly validationEmptyState: Locator;
  readonly validationAllPassed: Locator;
  readonly validationBadgePass: Locator;
  readonly validationBadgeWarning: Locator;
  readonly validationBadgeFail: Locator;

  constructor(page: Page, isDocusaurus = false) {
    this.page = page;
    this.isDocusaurus = isDocusaurus;

    this.settingsPanel = page.getByTestId("settings-panel");

    //Right panel tabs
    this.tabOverview = page.getByTestId("tab-overview");
    this.tabFunctions = page.getByTestId("tab-functions");
    this.tabRawHttp = page.getByTestId("tab-rawhttp");
    this.tabValidation = page.getByTestId("tab-validation");

    //Overview
    this.serverName = page.getByTestId("server-name");
    this.serverVersion = page.getByTestId("server-version");

    // Overview sections
    this.remotesSection = page.getByTestId("remotes-section");
    this.capabilitiesSection = page.getByTestId("capabilities-section");
    this.toolsSection = page.getByTestId("tools-section");
    this.resourcesSection = page.getByTestId("resources-section");
    this.promptsSection = page.getByTestId("prompts-section");

    //Tools
    this.executeButton = page.getByTestId("execute-button");

    //Editor
    this.editorPanel = page.getByTestId("editor-panel");
    this.toolbarFormat = page.getByTestId("toolbar-format");
    this.toolbarCopy = page.getByTestId("toolbar-copy");
    this.toolbarReset = page.getByTestId("toolbar-reset");
    this.editorParseError = page.getByTestId("editor-parse-error");

    //Connection
    this.connectionUrl = page.getByTestId("connection-url");
    this.connectBtn = page.getByTestId("connect-btn");
    this.disconnectBtn = page.getByTestId("disconnect-btn");
    this.connectionStatus = page.getByTestId("connection-status");
    this.addServerBtn = page.getByTestId("add-server-btn");

    //Authtype and connection settings
    this.transportTypeSelect = page.getByTestId("transport-type-select");
    this.authTypeSelect = page.getByTestId("auth-type-select");
    this.basicAuthUsername = page.getByTestId("basic-auth-username");
    this.basicAuthPassword = page.getByTestId("basic-auth-password");
    this.bearerToken = page.getByTestId("bearer-token");
    this.serverInfo = page.getByTestId("server-info");

    // Raw HTTP log
    this.logPanel = page.getByTestId("mcp-log-panel");
    this.logEmptyState = page.getByTestId("log-empty-state");
    this.logList = page.getByTestId("log-list");
    this.logClearBtn = page.getByTestId("log-clear-btn");

    // Validation
    this.validationPanel = page.getByTestId("validation-panel");
    this.validationSummary = page.getByTestId("validation-summary");
    this.validationResultsList = page.getByTestId("validation-results-list");
    this.validationEmptyState = page.getByTestId("validation-empty-state");
    this.validationAllPassed = page.getByTestId("validation-all-passed");
    this.validationBadgePass = page.getByTestId("validation-badge-pass");
    this.validationBadgeWarning = page.getByTestId("validation-badge-warning");
    this.validationBadgeFail = page.getByTestId("validation-badge-fail");
  }

  async goto() {
    await this.page.goto(this.isDocusaurus ? "/playground" : "/");
    await this.waitForPlaygroundReady();
  }

  async waitForPlaygroundReady() {
    if (this.isDocusaurus) {
      // Wait for the standalone bundle to load
      await this.page.waitForFunction(
        () => !!(window as unknown as Record<string, unknown>).MCPPlayground,
        {
          timeout: CONNECTION_TIMEOUT,
        },
      );
    }
    // Wait for either settings panel or editor panel to appear
    await this.page.waitForSelector(
      "[data-testid='settings-panel'], [data-testid='editor-panel'], [data-testid='tab-overview']",
      { timeout: CONNECTION_TIMEOUT },
    );
    // Give the UI a moment to settle (lazy loading, agent list fetch)
    await this.page.waitForTimeout(500);
  }
  logEntry(index: number): Locator {
    return this.page.getByTestId("mcp-log-entry").nth(index);
  }

  logEntryMethod(index: number): Locator {
    return this.logEntry(index).getByTestId("log-entry-method");
  }

  logEntryUrl(index: number): Locator {
    return this.logEntry(index).getByTestId("log-entry-url");
  }

  logEntryDetails(index: number): Locator {
    return this.logEntry(index).getByTestId("log-entry-details");
  }

  logEntryEditResend(index: number): Locator {
    return this.logEntry(index).getByTestId("log-entry-edit-resend");
  }

  logEntryCopyCurl(index: number): Locator {
    return this.logEntry(index).getByTestId("log-entry-copy-curl");
  }

  logEntryRequest(index: number): Locator {
    return this.logEntry(index).getByTestId("log-entry-request");
  }

  logEntryRequestUrl(index: number): Locator {
    return this.logEntry(index).getByTestId("log-entry-request-url");
  }

  logEntryRequestBody(index: number): Locator {
    return this.logEntry(index).getByTestId("log-entry-request-body");
  }

  logEntryResponse(index: number): Locator {
    return this.logEntry(index).getByTestId("log-entry-response");
  }

  logEntryResponseStatus(index: number): Locator {
    return this.logEntry(index).getByTestId("log-entry-response-status");
  }

  logEntryResponseBody(index: number): Locator {
    return this.logEntry(index).getByTestId("log-entry-response-body");
  }

  validationResultCard(index: number): Locator {
    return this.page.getByTestId("validation-result-card").nth(index);
  }

  serverSelectorItem(id: string): Locator {
    return this.page.getByTestId(`server-selector-item-${id}`);
  }

  remoteItem(idx: number): Locator {
    return this.page.getByTestId(`remote-item-${idx}`);
  }

  capabilityBadge(key: string): Locator {
    return this.page.getByTestId(`capability-${key}`);
  }

  toolItem(name: string): Locator {
    return this.page.getByTestId(`tool-item-${name}`);
  }

  toolTrigger(name: string): Locator {
    return this.page.getByTestId(`tool-trigger-${name}`);
  }

  toolTryIt(name: string): Locator {
    return this.page.getByTestId(`tool-try-it-${name}`);
  }

  resourceItem(uri: string): Locator {
    return this.page.getByTestId(`resource-item-${uri}`);
  }

  resourceTrigger(uri: string): Locator {
    return this.page.getByTestId(`resource-trigger-${uri}`);
  }

  promptItem(name: string): Locator {
    return this.page.getByTestId(`prompt-item-${name}`);
  }

  promptTrigger(name: string): Locator {
    return this.page.getByTestId(`prompt-trigger-${name}`);
  }

  promptTryIt(name: string): Locator {
    return this.page.getByTestId(`prompt-try-it-${name}`);
  }

  async selectServer(serverId: string) {
    const card = this.serverSelectorItem(serverId);

    const cardExists = await card.isVisible().catch(() => false);
    if (!cardExists && serverId.startsWith("mock-")) {
      if (await this.disconnectBtn.isVisible().catch(() => false)) {
        await this.disconnectBtn.click();
        await expect(this.connectionStatus).toHaveText("disconnected");
      }
      const mockName = serverId.replace(/^mock-/, "");
      await this.connectionUrl.fill(`mock://${mockName}`);
      await this.connectionUrl.press("Enter");
      await this.connectionStatus.waitFor();
      await expect(this.connectionStatus).toHaveText("connected");
      return;
    }

    await card.waitFor();
    await card.click();
    // Wait for connection to complete
    await this.connectionStatus.waitFor();
    await expect(this.connectionStatus).toHaveText("connected");
  }
}
// Custom fixture that creates a PlaygroundPage with the correct isDocusaurus flag
export const test = base.extend<{ playground: PlaygroundPage }>({
  playground: async ({ page, baseURL }, use) => {
    const isDocusaurus = baseURL?.includes("3000") ?? false;
    const pg = new PlaygroundPage(page, isDocusaurus);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(pg);
  },
});

export { expect } from "@playwright/test";
