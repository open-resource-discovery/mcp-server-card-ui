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
  test("should not accept invalid url", async ({ playground }) => {
    await playground.goto();
    await playground.connectionUrl.fill("mock://invalid");
    await playground.connectionUrl.press("Enter");
    await expect(playground.connectionStatus).toHaveText("error");
  });
  test("should display server info after connecting", async ({
    playground,
  }) => {
    await playground.goto();
    await playground.connectionUrl.fill("mock://echo");
    await playground.connectionUrl.press("Enter");
    await expect(playground.serverInfo).toBeVisible();
    await expect(playground.serverInfo).toContainText("Echo Server");
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
