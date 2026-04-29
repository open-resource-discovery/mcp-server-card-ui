import { test, expect } from "../fixtures/playground";

test.describe("Connection Flow", () => {
  test.beforeEach(async ({ playground }) => {
    //test.skip(!playground.isMock, "Requires mock servers");
    await playground.goto();
    await playground.selectServer("mock-echo");
  });

  test("should auto-connect on load and select server", async ({
    playground,
  }) => {
    await expect(playground.connectionStatus).toHaveText("connected");
  });

  test("should display server details in overview after connecting", async ({
    playground,
  }) => {
    await expect(playground.serverName).toHaveText("mock/echo");
    await expect(playground.serverVersion).toContainText("1.0.0");
  });

  test("should populate editor with server card JSON", async ({
    playground,
  }) => {
    // Verify the editor has content by checking the toolbar buttons are enabled
    await expect(playground.toolbarFormat).toBeEnabled();
  });

  test("should disconnect and return to disconnected state", async ({
    playground,
  }) => {
    await expect(playground.connectionStatus).toHaveText("connected");
    await playground.disconnectBtn.click();
    await expect(playground.connectionStatus).toHaveText("disconnected");
  });

  test("should connect by clicking the Connect button", async ({
    playground,
  }) => {
    // First disconnect if we're already connected
    if ((await playground.connectionStatus.textContent()) === "connected") {
      await playground.disconnectBtn.click();
      await expect(playground.connectionStatus).toHaveText("disconnected");
    }
    // Enter a valid URL and click Connect
    await playground.connectionUrl.fill("mock://echo");
    await playground.connectBtn.click();
    // Verify connection status updates
    await expect(playground.connectionStatus).toHaveText("connected");
  });
  test("should show server info after connecting", async ({ playground }) => {
    await expect(playground.serverInfo).toBeVisible();
    await expect(playground.serverInfo).toContainText("mock/echo");
  });
  test("should hide server info after disconnecting", async ({
    playground,
  }) => {
    await playground.disconnectBtn.click();
    await expect(playground.serverInfo).toBeHidden();
  });
});
