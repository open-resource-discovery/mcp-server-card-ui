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
    await playground.serverSelectorItem("mock-echo").click();
    await expect(playground.serverSelectorItem("mock-echo")).toHaveClass(
      /border-primary/,
    );
    await expect(playground.serverSelectorItem("mock-weather")).not.toHaveClass(
      /border-primary/,
    );
  });

  test("should select weather server on click", async ({ playground }) => {
    await playground.serverSelectorItem("mock-weather").click();
    await expect(playground.serverSelectorItem("mock-weather")).toHaveClass(
      /border-primary/,
    );
    await expect(playground.serverSelectorItem("mock-echo")).not.toHaveClass(
      /border-primary/,
    );
  });

  test("should select weather server by url and connect", async ({
    playground,
  }) => {
    await playground.connectionUrl.fill("mock://weather");
    await playground.connectionUrl.press("Enter");
    await expect(playground.connectionStatus).toHaveText("connected");
    await expect(playground.serverSelectorItem("mock-weather")).toHaveClass(
      /border-primary/,
    );
    await expect(playground.serverSelectorItem("mock-echo")).not.toHaveClass(
      /border-primary/,
    );
  });

  test("should select echo server by url and connect", async ({
    playground,
  }) => {
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

  test("should report a malformed ORD entry point without crashing", async ({
    playground,
  }) => {
    const ordUrl = "https://ord.test/.well-known/open-resource-discovery";
    const ordRequestMethods: string[] = [];
    await playground.page.route("https://ord.test/**", async (route) => {
      ordRequestMethods.push(route.request().method());
      if (route.request().url() === ordUrl) {
        await route.fulfill({
          json: {
            baseUrl: "https://ord.test",
            openResourceDiscoveryV1: {
              documents: [{ url: "/ord/document" }],
            },
          },
        });
        return;
      }
      await route.fulfill({
        json: {
          apiResources: [
            {
              ordId: "example:apiResource:broken:v1",
              apiProtocol: "mcp",
              entryPoints: [{ url: "mock://calculator" }],
            },
          ],
        },
      });
    });

    await playground.connectionUrl.fill(ordUrl);
    await playground.addServerBtn.click();

    await expect(playground.serverLoadNotice).toContainText(
      "ORD discovery failed. No MCP servers were added.",
    );
    await expect(playground.serverLoadNotice).toContainText(
      'resource "example:apiResource:broken:v1"',
    );
    await expect(playground.serverLoadNotice).toContainText(
      "apiResources[0].entryPoints[0]",
    );
    await expect(playground.serverLoadNotice).toContainText("received object");
    await expect(
      playground.settingsPanel
        .locator('[data-testid^="server-selector-item-"]')
        .filter({ hasText: "ord.test" }),
    ).toHaveCount(0);
    await expect(
      playground.page.getByText("Something went wrong"),
    ).not.toBeVisible();

    await playground.disconnectBtn.click();
    await expect(playground.connectionStatus).toHaveText("disconnected");
    expect(ordRequestMethods).toEqual(["GET", "GET"]);
  });

  test("should add valid ORD servers and warn about malformed resources", async ({
    playground,
  }) => {
    const ordUrl = "https://ord.test/.well-known/open-resource-discovery";
    await playground.page.route("https://ord.test/**", async (route) => {
      if (route.request().url() === ordUrl) {
        await route.fulfill({
          json: {
            baseUrl: "https://ord.test",
            openResourceDiscoveryV1: {
              documents: [{ url: "/ord/document" }],
            },
          },
        });
        return;
      }
      await route.fulfill({
        json: {
          apiResources: [
            {
              ordId: "example:apiResource:calculator:v1",
              apiProtocol: "mcp",
              title: "ORD Calculator",
              shortDescription: "Valid discovered server",
              entryPoints: ["mock://echo"],
            },
            {
              ordId: "example:apiResource:broken:v1",
              apiProtocol: "mcp",
              entryPoints: [{ url: "mock://weather" }],
            },
          ],
        },
      });
    });

    await playground.connectionUrl.fill(ordUrl);
    await playground.addServerBtn.click();

    await expect(playground.connectionStatus).toHaveText("connected");
    await expect(playground.connectionUrl).toHaveValue("mock://echo");
    await expect(
      playground.serverSelectorItem("custom-example:apiResource:calculator:v1"),
    ).toBeVisible();
    await expect(playground.serverLoadNotice).toContainText(
      "Added 1 of 1 discovered MCP server with 1 warning.",
    );
    await expect(playground.serverLoadNotice).toContainText(
      'resource "example:apiResource:broken:v1"',
    );
    await expect(
      playground.page.getByText("Something went wrong"),
    ).not.toBeVisible();
  });

  test("should continue after duplicates and no-op when all servers exist", async ({
    playground,
  }) => {
    const ordUrl = "https://ord.test/.well-known/open-resource-discovery";
    const firstResource = {
      ordId: "example:apiResource:first:v1",
      apiProtocol: "mcp",
      title: "First ORD Server",
      entryPoints: ["mock://weather"],
    };
    const secondResource = {
      ordId: "example:apiResource:second:v1",
      apiProtocol: "mcp",
      title: "Second ORD Server",
      entryPoints: ["mock://calculator"],
    };
    let resources = [firstResource];

    await playground.page.route("https://ord.test/**", async (route) => {
      if (route.request().url() === ordUrl) {
        await route.fulfill({
          json: {
            baseUrl: "https://ord.test",
            openResourceDiscoveryV1: {
              documents: [{ url: "/ord/document" }],
            },
          },
        });
        return;
      }
      await route.fulfill({ json: { apiResources: resources } });
    });

    await playground.connectionUrl.fill(ordUrl);
    await playground.addServerBtn.click();
    await expect(
      playground.serverSelectorItem("custom-example:apiResource:first:v1"),
    ).toBeVisible();

    resources = [firstResource, secondResource];
    await playground.connectionUrl.fill(ordUrl);
    await playground.addServerBtn.click();

    const secondServer = playground.serverSelectorItem(
      "custom-example:apiResource:second:v1",
    );
    await expect(secondServer).toBeVisible();
    await expect(secondServer).toHaveAttribute("aria-selected", "true");
    await expect(playground.connectionUrl).toHaveValue("mock://calculator");
    await expect(playground.serverLoadNotice).toContainText(
      "Added 1 of 2 discovered MCP servers with 1 warning.",
    );
    await expect(playground.serverLoadNotice).toContainText(
      "A server with this ID already exists.",
    );

    await playground.connectionUrl.fill(ordUrl);
    await playground.addServerBtn.click();

    await expect(playground.connectionStatus).toHaveText("connected");
    await expect(secondServer).toHaveAttribute("aria-selected", "true");
    await expect(playground.serverLoadNotice).toContainText(
      "No new MCP servers were added.",
    );
    await expect(playground.serverLoadNotice).toContainText(
      "A server with this ID already exists.",
    );
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
