import { test, expect } from "../fixtures/playground";

test.describe("Tools", () => {
  test.beforeEach(async ({ playground }) => {
    await playground.goto();
    await playground.tabFunctions.click();
  });
  test("should display the tools tab", async ({ playground }) => {
    await expect(playground.tabFunctions).toHaveAttribute(
      "data-state",
      "active",
    );
    //await expect(playground.toolsPanel).toBeVisible();
  });
  test("Execute button should be disabled at the beginning", async ({
    playground,
  }) => {
    await expect(playground.executeButton).toBeDisabled();
  });

  test("Execute button should be enabled after selecting a tool", async ({
    playground,
  }) => {
    await playground.selectServer("mock-echo");
    await playground.page
      .getByRole("combobox")
      .filter({ hasText: "Select tool..." })
      .click();
    await playground.page.getByRole("option", { name: "echo" }).click();
    await expect(playground.executeButton).toBeEnabled();
  });

  test("Execute button should be disabled after disconnecting", async ({
    playground,
  }) => {
    await playground.selectServer("mock-echo");
    await playground.page
      .getByRole("combobox")
      .filter({ hasText: "Select tool..." })
      .click();
    await playground.page.getByRole("option", { name: "echo" }).click();
    await expect(playground.executeButton).toBeEnabled();
    await playground.disconnectBtn.click();
    await expect(playground.executeButton).toBeDisabled();
  });
});

test.describe("Overview", () => {
  test.beforeEach(async ({ playground }) => {
    await playground.goto();
    await playground.tabOverview.click();
  });

  test.describe("Echo server", () => {
    test.beforeEach(async ({ playground }) => {
      await playground.selectServer("mock-echo");
    });

    test("should show Remote Transports section", async ({ playground }) => {
      await expect(playground.remotesSection).toBeVisible();
    });

    test("should show Capabilities section", async ({ playground }) => {
      await expect(playground.capabilitiesSection).toBeVisible();
    });

    test("should show Tools section", async ({ playground }) => {
      await expect(playground.toolsSection).toBeVisible();
    });

    test("should not show Resources section", async ({ playground }) => {
      await expect(playground.resourcesSection).not.toBeVisible();
    });

    test("should not show Prompts section", async ({ playground }) => {
      await expect(playground.promptsSection).not.toBeVisible();
    });

    test("should expand echo tool and navigate to Tools panel via Try it", async ({
      playground,
    }) => {
      const trigger = playground.toolTrigger("echo");
      await expect(trigger).toBeVisible();
      await expect(trigger).toBeEnabled();

      await trigger.click();

      const tryItBtn = playground.toolTryIt("echo");
      await expect(tryItBtn).toBeVisible();
      await expect(tryItBtn).toBeEnabled();

      await tryItBtn.click();

      await expect(playground.tabFunctions).toHaveAttribute(
        "data-state",
        "active",
      );
      await expect(
        playground.page.getByRole("combobox").filter({ hasText: "echo" }),
      ).toBeVisible();
      await expect(playground.executeButton).toBeEnabled();
    });
  });

  test.describe("Weather server", () => {
    test.beforeEach(async ({ playground }) => {
      await playground.selectServer("mock-weather");
    });

    test("should show Remote Transports section", async ({ playground }) => {
      await expect(playground.remotesSection).toBeVisible();
    });

    test("should show Capabilities section", async ({ playground }) => {
      await expect(playground.capabilitiesSection).toBeVisible();
    });

    test("should show Tools section", async ({ playground }) => {
      await expect(playground.toolsSection).toBeVisible();
    });

    test("should show Resources section", async ({ playground }) => {
      await expect(playground.resourcesSection).toBeVisible();
    });

    test("should show Prompts section", async ({ playground }) => {
      await expect(playground.promptsSection).toBeVisible();
    });

    for (const { name, displayName } of [
      { name: "get_weather", displayName: "Get Current Weather" },
      { name: "get_forecast", displayName: "Get Weather Forecast" },
    ]) {
      test(`should expand ${name} tool and navigate to Tools panel via Try it`, async ({
        playground,
      }) => {
        const trigger = playground.toolTrigger(name);
        await expect(trigger).toBeVisible();
        await expect(trigger).toBeEnabled();

        await trigger.click();

        const tryItBtn = playground.toolTryIt(name);
        await expect(tryItBtn).toBeVisible();
        await expect(tryItBtn).toBeEnabled();

        await tryItBtn.click();

        await expect(playground.tabFunctions).toHaveAttribute(
          "data-state",
          "active",
        );
        await expect(
          playground.page
            .getByRole("combobox")
            .filter({ hasText: displayName }),
        ).toBeVisible();
        await expect(playground.executeButton).toBeEnabled();
      });
    }
  });
});
