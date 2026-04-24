import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMCPConnectionStore } from "../mcpConnectionStore";
import { useServerCardStore } from "../serverCardStore";

vi.mock("@lib/utils/mcp-transport", () => ({
  sendRequest: vi.fn(),
  sendNotification: vi.fn().mockResolvedValue(undefined),
  deleteSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@lib/utils/mcp-jsonrpc", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@lib/utils/mcp-jsonrpc")>();
  return { ...actual, resetIdCounter: vi.fn() };
});

vi.mock("@lib/utils/playground-config", () => ({
  getConfigAuth: vi.fn().mockReturnValue({}),
}));

import { sendRequest } from "@lib/utils/mcp-transport";

const mockSendRequest = vi.mocked(sendRequest);

function makeResponse(id: number, result: unknown) {
  return {
    response: { jsonrpc: "2.0" as const, id, result },
    sessionId: undefined,
  };
}

const INIT_RESPONSE = makeResponse(1, {
  protocolVersion: "2025-03-26",
  serverInfo: { name: "test/server", title: "Test Server", version: "1.0.0" },
  capabilities: {
    tools: { listChanged: false },
    resources: { subscribe: false, listChanged: false },
    prompts: { listChanged: false },
  },
});

const TOOLS_RESPONSE = makeResponse(2, {
  tools: [
    {
      name: "my_tool",
      description: "A tool",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
  ],
});

const RESOURCES_RESPONSE = makeResponse(3, {
  resources: [
    {
      uri: "resource://test/item",
      name: "test_item",
      description: "A resource",
      mimeType: "application/json",
    },
  ],
});

const PROMPTS_RESPONSE = makeResponse(4, {
  prompts: [
    {
      name: "my_prompt",
      description: "A prompt",
      arguments: [],
    },
  ],
});

beforeEach(() => {
  useMCPConnectionStore.getState().reset();
  useServerCardStore.setState({ rawJson: "", parsedCard: null });
  vi.clearAllMocks();
});

describe("buildServerCardFromConnection (via connect)", () => {
  it("should set rawJson in serverCardStore after connecting", async () => {
    mockSendRequest
      .mockResolvedValueOnce(INIT_RESPONSE)
      .mockResolvedValueOnce(TOOLS_RESPONSE)
      .mockResolvedValueOnce(RESOURCES_RESPONSE)
      .mockResolvedValueOnce(PROMPTS_RESPONSE);

    useMCPConnectionStore.setState({ url: "mock://test" });
    await useMCPConnectionStore.getState().connect();

    const rawJson = useServerCardStore.getState().rawJson;
    expect(rawJson).not.toBe("");
    const card = JSON.parse(rawJson);
    expect(card.name).toBe("test/server");
    expect(card.version).toBe("1.0.0");
    expect(card.remotes).toEqual([
      { type: "streamable-http", url: "mock://test" },
    ]);
  });

  it("should include tools in the card when server advertises tools capability", async () => {
    mockSendRequest
      .mockResolvedValueOnce(INIT_RESPONSE)
      .mockResolvedValueOnce(TOOLS_RESPONSE)
      .mockResolvedValueOnce(RESOURCES_RESPONSE)
      .mockResolvedValueOnce(PROMPTS_RESPONSE);

    useMCPConnectionStore.setState({ url: "mock://test" });
    await useMCPConnectionStore.getState().connect();

    const card = JSON.parse(useServerCardStore.getState().rawJson);
    expect(card.tools).toHaveLength(1);
    expect(card.tools[0].name).toBe("my_tool");
  });

  it("should include resources in the card when server advertises resources capability", async () => {
    mockSendRequest
      .mockResolvedValueOnce(INIT_RESPONSE)
      .mockResolvedValueOnce(TOOLS_RESPONSE)
      .mockResolvedValueOnce(RESOURCES_RESPONSE)
      .mockResolvedValueOnce(PROMPTS_RESPONSE);

    useMCPConnectionStore.setState({ url: "mock://test" });
    await useMCPConnectionStore.getState().connect();

    const card = JSON.parse(useServerCardStore.getState().rawJson);
    expect(card.resources).toHaveLength(1);
    expect(card.resources[0].uri).toBe("resource://test/item");
  });

  it("should include prompts in the card when server advertises prompts capability", async () => {
    mockSendRequest
      .mockResolvedValueOnce(INIT_RESPONSE)
      .mockResolvedValueOnce(TOOLS_RESPONSE)
      .mockResolvedValueOnce(RESOURCES_RESPONSE)
      .mockResolvedValueOnce(PROMPTS_RESPONSE);

    useMCPConnectionStore.setState({ url: "mock://test" });
    await useMCPConnectionStore.getState().connect();

    const card = JSON.parse(useServerCardStore.getState().rawJson);
    expect(card.prompts).toHaveLength(1);
    expect(card.prompts[0].name).toBe("my_prompt");
  });

  it("should omit tools from card when server has no tools capability", async () => {
    const initNoTools = makeResponse(1, {
      protocolVersion: "2025-03-26",
      serverInfo: { name: "test/server", version: "1.0.0" },
      capabilities: {},
    });

    mockSendRequest.mockResolvedValueOnce(initNoTools);

    useMCPConnectionStore.setState({ url: "mock://test" });
    await useMCPConnectionStore.getState().connect();

    const card = JSON.parse(useServerCardStore.getState().rawJson);
    expect(card.tools).toBeUndefined();
    expect(card.resources).toBeUndefined();
    expect(card.prompts).toBeUndefined();
  });

  it("should still set rawJson if a capability fetch fails", async () => {
    mockSendRequest
      .mockResolvedValueOnce(INIT_RESPONSE)
      .mockRejectedValueOnce(new Error("tools/list failed"))
      .mockResolvedValueOnce(RESOURCES_RESPONSE)
      .mockResolvedValueOnce(PROMPTS_RESPONSE);

    useMCPConnectionStore.setState({ url: "mock://test" });
    await useMCPConnectionStore.getState().connect();

    const rawJson = useServerCardStore.getState().rawJson;
    expect(rawJson).not.toBe("");
    const card = JSON.parse(rawJson);
    expect(card.tools).toBeUndefined();
    expect(card.resources).toHaveLength(1);
  });

  it("should include title in card when serverInfo has title", async () => {
    mockSendRequest
      .mockResolvedValueOnce(INIT_RESPONSE)
      .mockResolvedValueOnce(TOOLS_RESPONSE)
      .mockResolvedValueOnce(RESOURCES_RESPONSE)
      .mockResolvedValueOnce(PROMPTS_RESPONSE);

    useMCPConnectionStore.setState({ url: "mock://test" });
    await useMCPConnectionStore.getState().connect();

    const card = JSON.parse(useServerCardStore.getState().rawJson);
    expect(card.title).toBe("Test Server");
  });

  it("should not overwrite rawJson when connect() fails", async () => {
    mockSendRequest.mockRejectedValueOnce(new Error("Network error"));

    useServerCardStore.setState({ rawJson: '{"existing": true}' });
    useMCPConnectionStore.setState({ url: "mock://test" });
    await useMCPConnectionStore.getState().connect();

    expect(useServerCardStore.getState().rawJson).toBe('{"existing": true}');
  });
});
