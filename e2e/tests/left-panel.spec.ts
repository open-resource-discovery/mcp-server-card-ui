import { test, expect } from "../fixtures/playground";

test.describe("Server Selector", () => {
  test.beforeEach(async ({ playground }) => {
    await playground.goto();
  });

  test("should show 2 predefined mock servers", async ({ playground }) => {
    await expect(playground.serverSelectorItem("mock-echo")).toBeVisible();
    await expect(playground.serverSelectorItem("mock-weather")).toBeVisible();
  });
  test("should select echo server on click", async ({ playground }) => {
    await playground.selectServer("mock-echo");
    await expect(playground.serverSelectorItem("mock-echo")).toHaveClass(
      /border-primary/,
    );
    await expect(playground.serverSelectorItem("mock-weather")).not.toHaveClass(
      /border-primary/,
    );
  });

  test("should select weather server on click", async ({ playground }) => {
    await playground.selectServer("mock-weather");
    await expect(playground.serverSelectorItem("mock-weather")).toHaveClass(
      /border-primary/,
    );
    await expect(playground.serverSelectorItem("mock-echo")).not.toHaveClass(
      /border-primary/,
    );
  });

  test("should select server by url and connect", async ({ playground }) => {
    await playground.connectionUrl.fill("mock://echo");
    await playground.connectionUrl.press("Enter");
    await expect(playground.connectionStatus).toHaveText("connected");
    await expect(playground.serverSelectorItem("mock-echo")).toHaveClass(
      /border-primary/,
    );
    await expect(playground.serverSelectorItem("mock-weather")).not.toHaveClass(
      /border-primary/,
    );
  });
});

test.describe("Connection URL", () => {
  test.beforeEach(async ({ playground }) => {
    await playground.goto();
  });

  test("should not accept invalid url", async ({ playground }) => {
    await playground.connectionUrl.fill("mock://invalid");
    await playground.connectionUrl.press("Enter");
    await playground.page.waitForTimeout(500);
    await expect(playground.connectionStatus).toHaveText("error");
  });

  test("should display server info after connecting", async ({
    playground,
  }) => {
    await playground.connectionUrl.fill("mock://echo");
    await playground.connectionUrl.press("Enter");
    await expect(playground.serverInfo).toBeVisible();
    await expect(playground.serverInfo).toContainText("mock/echo");
  });

  test("should show + button when typing mock://calculator", async ({
    playground,
  }) => {
    await playground.connectionUrl.fill("mock://calculator");
    await expect(playground.addServerBtn).toBeVisible();
  });

  test("should not show + button when URL matches existing predefined server", async ({
    playground,
  }) => {
    await playground.connectionUrl.fill("mock://echo");
    await expect(playground.addServerBtn).not.toBeVisible();
  });

  test("should not show + button when URL matches already added custom server", async ({
    playground,
  }) => {
    await playground.connectionUrl.fill("mock://calculator");
    await playground.addServerBtn.click();
    await expect(playground.connectionStatus).toHaveText("connected");
    await playground.connectionUrl.fill("mock://calculator");
    await expect(playground.addServerBtn).not.toBeVisible();
  });

  test("should add calculator server to list on + click", async ({
    playground,
  }) => {
    await playground.connectionUrl.fill("mock://calculator");
    await playground.addServerBtn.click();
    await expect(playground.connectionStatus).toHaveText("connected");
    await expect(
      playground.settingsPanel
        .getByRole("listitem")
        .filter({ hasText: "calculator" }),
    ).toBeVisible();
  });

  test("should remove calculator server from list on cross button click", async ({
    playground,
  }) => {
    await playground.connectionUrl.fill("mock://calculator");
    await playground.addServerBtn.click();
    await expect(playground.connectionStatus).toHaveText("connected");

    const calculatorItem = playground.settingsPanel
      .getByRole("listitem")
      .filter({ hasText: "calculator" });
    await calculatorItem.hover();
    await calculatorItem.getByTitle("Remove server").click();
    await expect(calculatorItem).not.toBeVisible();
  });
});
test.describe("Predefined Server Auto-Select", () => {
  test("should auto-select first server on load if none selected", async ({
    playground,
  }) => {
    await playground.goto();
    await expect(playground.serverSelectorItem("mock-echo")).toHaveClass(
      /border-primary/,
    );
  });
});

test.describe("Authtype and Transport Type Selectors", () => {
  test("should show transport type and auth type selectors", async ({
    playground,
  }) => {
    await playground.goto();
    await expect(playground.transportTypeSelect).toBeVisible();
    await expect(playground.authTypeSelect).toBeVisible();
  });
  test("should show basic auth fields when Basic Auth is selected", async ({
    playground,
  }) => {
    await playground.goto();
    await playground.authTypeSelect.click();
    await playground.page.getByRole("option", { name: "Basic Auth" }).click();
    await expect(playground.basicAuthUsername).toBeVisible();
    await expect(playground.basicAuthPassword).toBeVisible();
  });
  test("should show bearer token field when Bearer Token is selected", async ({
    playground,
  }) => {
    await playground.goto();
    await playground.authTypeSelect.click();
    await playground.page.getByRole("option", { name: "Bearer Token" }).click();
    await expect(playground.bearerToken).toBeVisible();
  });
});
