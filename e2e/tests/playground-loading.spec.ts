import { test, expect } from "../fixtures/playground";

test.describe("Playground Loading", () => {
  test("should load playground at /playground", async ({ playground }) => {
    await playground.goto();
    await expect(playground.tabOverview).toBeVisible();
  });

  test("should show three panels on desktop", async ({ playground }) => {
    await playground.goto();
    await expect(playground.settingsPanel).toBeVisible();
    await expect(playground.editorPanel).toBeVisible();
    await expect(playground.tabOverview).toBeVisible();
  });

  test("should show Overview, Tools, Raw HTTP and Validation tabs", async ({
    playground,
  }) => {
    await playground.goto();
    await expect(playground.tabOverview).toBeVisible();
    await expect(playground.tabFunctions).toBeVisible();
    await expect(playground.tabRawHttp).toBeVisible();
    await expect(playground.tabValidation).toBeVisible();
  });

  test("should default to Overview tab", async ({ playground }) => {
    await playground.goto();
    await expect(playground.tabOverview).toHaveAttribute("data-active", "");
  });
});
test.describe("Navigation bar", () => {
  test.beforeEach(async ({ playground }) => {
    test.skip(!playground.isDocusaurus, "Requires Docusaurus");
    await playground.page.goto("/");
  });

  test("should show home link", async ({ playground }) => {
    await expect(playground.page.locator(".navbar__brand")).toBeVisible();
  });

  test("should show Documentation link", async ({ playground }) => {
    await expect(
      playground.page.getByRole("link", { name: "Documentation" }),
    ).toBeVisible();
  });

  test("should show Playground link", async ({ playground }) => {
    await expect(
      playground.page.locator("nav").getByRole("link", { name: "Playground" }),
    ).toBeVisible();
  });

  test("should show GitHub link", async ({ playground }) => {
    await expect(playground.page.locator(".header-github-pill")).toBeVisible();
  });

  test("should show light/dark mode toggle", async ({ playground }) => {
    await expect(
      playground.page.getByRole("button", {
        name: /switch between dark and light mode/i,
      }),
    ).toBeVisible();
  });

  test("should show search panel", async ({ playground }) => {
    await expect(
      playground.page.getByRole("textbox", { name: "Search" }),
    ).toBeVisible();
  });
});
