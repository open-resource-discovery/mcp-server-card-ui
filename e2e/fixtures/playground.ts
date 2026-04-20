import { type Page, type Locator, expect } from "@playwright/test";
import { test as base } from "@playwright/test";

export class PlaygroundPage {
    readonly page: Page;
    readonly isDocusaurus: boolean;

    // Settings panel
    readonly settingsPanel: Locator;

    // Editor
    readonly editorPanel: Locator;

    // Right panel tabs
    readonly tabOverview: Locator;
    readonly tabFunctions: Locator;
    readonly tabRawHttp: Locator;
    readonly tabValidation: Locator;

    constructor(page: Page, isDocusaurus = false) {
        this.page = page;
        this.isDocusaurus = isDocusaurus;

        this.settingsPanel = page.getByTestId("settings-panel");
        this.editorPanel = page.getByTestId("editor-panel");
        this.tabOverview = page.getByTestId("tab-overview");
        this.tabFunctions = page.getByTestId("tab-functions");
        this.tabRawHttp = page.getByTestId("tab-rawhttp");
        this.tabValidation = page.getByTestId("tab-validation");

    }

    async goto() {
        await this.page.goto(this.isDocusaurus ? "/playground" : "/");
        await this.waitForPlaygroundReady();
    }

    async waitForPlaygroundReady() {
        if (this.isDocusaurus) {
        // Wait for the standalone bundle to load
        await this.page.waitForFunction(() => !!(window as unknown as Record<string, unknown>).MCPPlayground, {
            timeout: 15000,
        });
        }
        // Wait for either settings panel or editor panel to appear
        await this.page.waitForSelector(
        "[data-testid='settings-panel'], [data-testid='editor-panel'], [data-testid='tab-overview']",
        { timeout: 15000 },
        );
        // Give the UI a moment to settle (lazy loading, agent list fetch)
        await this.page.waitForTimeout(500);
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