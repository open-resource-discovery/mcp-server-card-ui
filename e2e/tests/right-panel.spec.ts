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
    //test.skip(!playground.isMock, "Requires mock servers");
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
    //test.skip(!playground.isMock, "Requires mock servers");
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
test.describe("Raw HTTP", () => {
  test.beforeEach(async ({ playground }) => {
    await playground.goto();
    await playground.selectServer("mock-weather");
    await playground.tabRawHttp.click();
    await playground.logList.waitFor();
  });
  test("should display the Raw HTTP tab", async ({ playground }) => {
    await expect(playground.tabRawHttp).toHaveAttribute("data-state", "active");
    await expect(playground.logClearBtn).toBeVisible();
    //await expect(playground.rawHttpPanel).toBeVisible();
  });
  test("should show empty state after clearing logs", async ({
    playground,
  }) => {
    await playground.logClearBtn.click();
    await expect(playground.logEmptyState).toBeVisible();
    await expect(playground.logList).not.toBeVisible();
  });

  test("should show log entries after connecting", async ({ playground }) => {
    await expect(playground.logList).toBeVisible();
    await expect(playground.logEntry(0)).toBeVisible();
  });

  test("should show method in log entry", async ({ playground }) => {
    await expect(playground.logEntryMethod(0)).toBeVisible();
  });

  test("should show server url in log entry", async ({ playground }) => {
    await expect(playground.logEntryUrl(0)).toContainText("mock://weather");
  });
});

test.describe("Validation", () => {
  test.beforeEach(async ({ playground }) => {
    await playground.goto();
    await playground.selectServer("mock-weather");
    await playground.tabValidation.click();
  });

  test("should display the Validation tab", async ({ playground }) => {
    await expect(playground.tabValidation).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  test("should show validation panel", async ({ playground }) => {
    await expect(playground.validationPanel).toBeVisible();
  });

  test("should show validation summary", async ({ playground }) => {
    await expect(playground.validationSummary).toBeVisible();
  });

  test("should show results or all-passed state", async ({ playground }) => {
    const resultCards = playground.validationResultCard(0);
    const allPassed = playground.validationAllPassed;
    await expect(resultCards.or(allPassed)).toBeVisible();
  });

  test("should not show empty state when results exist", async ({
    playground,
  }) => {
    await expect(playground.validationEmptyState).not.toBeVisible();
  });

  test("should show pass or warning or fail badge", async ({ playground }) => {
    const anyBadge = playground.page.getByTestId(/^validation-badge-/);
    await expect(anyBadge.first()).toBeVisible();
  });

  test("should show fail badge after entering invalid content", async ({
    playground,
  }) => {
    await playground.page.locator(".monaco-editor").first().click();
    await playground.page.keyboard.press("Control+a");
    await playground.page.keyboard.type("{Something wrong}");
    await expect(playground.validationBadgeFail).toBeVisible();
  });

  test("should show Name format error after replacing name with invalid value", async ({
    playground,
  }) => {
    await playground.page.locator(".monaco-editor").first().click();
    await playground.page.keyboard.press("Control+h");
    await playground.page
      .locator('[aria-label="Find"]')
      .first()
      .fill("mock/weather");
    await playground.page
      .locator('[aria-label="Replace"]')
      .first()
      .fill("Bad name");
    await playground.page.keyboard.press("Control+Alt+Enter");
    await playground.page.keyboard.press("Escape");
    await expect(
      playground.validationResultsList.getByText("Name format").first(),
    ).toBeVisible();
  });

  test("should show all-passed state for echo server", async ({
    playground,
  }) => {
    await playground.selectServer("mock-echo");
    await expect(playground.validationAllPassed).toBeVisible();
  });
});

test.describe("Overview", () => {
  test.beforeEach(async ({ playground }) => {
    await playground.goto();
    await playground.tabOverview.click();
  });

  test.describe("Echo server", () => {
    test.beforeEach(async ({ playground }) => {
      //test.skip(!playground.isMock, "Requires mock servers");
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
      //test.skip(!playground.isMock, "Requires mock servers");
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

test.describe("Log Entry Expanded", () => {
  test.beforeEach(async ({ playground }) => {
    await playground.goto();
    await playground.selectServer("mock-weather");
    await playground.tabRawHttp.click();
    await playground.logList.waitFor();
    await playground.page.getByTestId("log-entry-trigger").first().click();
    await expect(playground.logEntryDetails(0)).toBeVisible();
  });

  test("should show Edit & Resend button", async ({ playground }) => {
    await expect(playground.logEntryEditResend(0)).toBeVisible();
  });

  test("should show Copy as cURL button", async ({ playground }) => {
    await expect(playground.logEntryCopyCurl(0)).toBeVisible();
  });

  test("should show request section", async ({ playground }) => {
    await expect(playground.logEntryRequest(0)).toBeVisible();
  });

  test("should show request URL", async ({ playground }) => {
    await expect(playground.logEntryRequestUrl(0)).toBeVisible();
    await expect(playground.logEntryRequestUrl(0)).toContainText(
      "mock://weather",
    );
  });

  test("should show request body", async ({ playground }) => {
    await expect(playground.logEntryRequestBody(0)).toBeVisible();
  });

  test("should show response section", async ({ playground }) => {
    await expect(playground.logEntryResponse(0)).toBeVisible();
  });

  test("should show response status", async ({ playground }) => {
    await expect(playground.logEntryResponseStatus(0)).toBeVisible();
    await expect(playground.logEntryResponseStatus(0)).toContainText(
      "HTTP 200",
    );
  });

  test("should show response body", async ({ playground }) => {
    await expect(playground.logEntryResponseBody(0)).toBeVisible();
  });

  test("Copy as cURL button copies curl command to clipboard", async ({
    playground,
  }) => {
    await playground.page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);
    await playground.logEntryCopyCurl(0).click();
    const text = await playground.page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(text).toContain("curl -X POST");
    expect(text).toContain("mock://weather");
  });
});
