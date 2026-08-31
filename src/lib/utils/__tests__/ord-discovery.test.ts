import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  discoverServersFromOrd,
  formatOrdDiscoveryIssue,
} from "../ord-discovery";

const ORD_URL = "http://localhost:3005/.well-known/open-resource-discovery";
const DOCUMENT_URL = "http://localhost:3005/ord/v1/document";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("discoverServersFromOrd", () => {
  it("rejects an object-valued MCP entry point with a detailed issue", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          baseUrl: "http://localhost:3005",
          openResourceDiscoveryV1: {
            documents: [{ url: "/ord/v1/document" }],
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          apiResources: [
            {
              ordId: "example:apiResource:broken:v1",
              apiProtocol: "mcp",
              entryPoints: [{ url: "http://localhost:3005/mcp" }],
            },
          ],
        }),
      );

    const result = await discoverServersFromOrd(ORD_URL, "custom-");

    expect(result.servers).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        phase: "resource",
        sourceUrl: DOCUMENT_URL,
        resourceId: "example:apiResource:broken:v1",
        path: "apiResources[0].entryPoints[0]",
        message: "Expected a non-empty string URL; received object.",
      }),
    ]);
    expect(formatOrdDiscoveryIssue(result.issues[0])).toBe(
      'ORD document http://localhost:3005/ord/v1/document, resource "example:apiResource:broken:v1", apiResources[0].entryPoints[0]: Expected a non-empty string URL; received object.',
    );
  });

  it("keeps valid resources, resolves relative URLs, and reports skipped resources", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          openResourceDiscoveryV1: {
            documents: [{ url: "/ord/v1/document" }],
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          describedSystemInstance: {
            baseUrl: "http://localhost:3005/services",
          },
          apiResources: [
            {
              ordId: "example:apiResource:valid:v1",
              apiProtocol: "mcp",
              title: "Valid server",
              entryPoints: ["/mcp"],
            },
            {
              ordId: "example:apiResource:document-relative:v1",
              apiProtocol: "mcp",
              entryPoints: ["relative-mcp"],
            },
            {
              ordId: "example:apiResource:broken:v1",
              apiProtocol: "mcp",
              entryPoints: [[{ url: "/mcp" }]],
            },
            {
              ordId: "example:apiResource:rest:v1",
              apiProtocol: "rest",
              entryPoints: ["/api"],
            },
          ],
        }),
      );

    const result = await discoverServersFromOrd(ORD_URL, "custom-");

    expect(result.servers).toEqual([
      expect.objectContaining({
        id: "custom-example:apiResource:valid:v1",
        title: "Valid server",
        url: "http://localhost:3005/services/mcp",
      }),
      expect.objectContaining({
        id: "custom-example:apiResource:document-relative:v1",
        url: "http://localhost:3005/ord/v1/relative-mcp",
      }),
    ]);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toEqual(
      expect.objectContaining({
        resourceId: "example:apiResource:broken:v1",
        path: "apiResources[2].entryPoints[0]",
        message: "Expected a non-empty string URL; received array.",
      }),
    );
  });

  it("continues after document HTTP and network failures", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          baseUrl: "http://localhost:3005",
          openResourceDiscoveryV1: {
            documents: [
              { url: "/ord/unavailable" },
              { url: "/ord/network-error" },
              { url: "/ord/valid" },
            ],
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(null, { status: 503, statusText: "Unavailable" }),
      )
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(
        jsonResponse({
          describedSystemInstance: {
            baseUrl: "http://localhost:3005",
          },
          apiResources: [
            {
              ordId: "example:apiResource:valid:v1",
              apiProtocol: "mcp",
              entryPoints: ["/mcp"],
            },
          ],
        }),
      );

    const result = await discoverServersFromOrd(ORD_URL);

    expect(result.servers).toEqual([
      expect.objectContaining({ url: "http://localhost:3005/mcp" }),
    ]);
    expect(result.issues.map((issue) => issue.message)).toEqual([
      "Request failed with HTTP 503 Unavailable.",
      "Network request failed (this can include a CORS failure): Failed to fetch.",
    ]);
  });

  it("reports invalid configuration JSON instead of throwing", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("{", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await discoverServersFromOrd(ORD_URL);

    expect(result.servers).toEqual([]);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toEqual(
      expect.objectContaining({
        phase: "configuration",
        sourceUrl: ORD_URL,
      }),
    );
    expect(result.issues[0].message).toContain("Response is not valid JSON:");
  });

  it("reports a non-string configured ORD URL without fetching", async () => {
    const result = await discoverServersFromOrd({ url: ORD_URL });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.servers).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        phase: "configuration",
        sourceUrl: "Configured ORD URL",
        path: "url",
        message: "Expected a string; received object.",
      }),
    ]);
  });

  it("appends base-relative document paths to a configuration base path", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          baseUrl: "http://localhost:3005/provider",
          openResourceDiscoveryV1: {
            documents: [{ url: "/ord/document" }],
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ apiResources: [] }));

    await discoverServersFromOrd(ORD_URL);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3005/provider/ord/document",
    );
  });

  it("reports an invalid configuration base URL and uses the endpoint fallback", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          baseUrl: "http://localhost:3005/provider?tenant=one",
          openResourceDiscoveryV1: {
            documents: [{ url: "/ord/document" }],
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ apiResources: [] }));

    const result = await discoverServersFromOrd(ORD_URL);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3005/ord/document",
    );
    expect(result.issues).toEqual([
      expect.objectContaining({
        path: "baseUrl",
        message: expect.stringContaining(
          "Expected an absolute HTTP(S) URL without a query or fragment",
        ),
      }),
    ]);
  });

  it("rejects base-relative entry points without a described system base URL", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          openResourceDiscoveryV1: {
            documents: [{ url: "/ord/v1/document" }],
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          apiResources: [
            {
              ordId: "example:apiResource:unresolved:v1",
              apiProtocol: "mcp",
              entryPoints: ["/mcp"],
            },
          ],
        }),
      );

    const result = await discoverServersFromOrd(ORD_URL);

    expect(result.servers).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        resourceId: "example:apiResource:unresolved:v1",
        path: "apiResources[0].entryPoints[0]",
        message:
          'Cannot resolve base-URL-relative entry point "/mcp" because describedSystemInstance.baseUrl is missing or invalid.',
      }),
    ]);
  });

  it("uses final response URLs when redirects change relative URL context", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          {
            openResourceDiscoveryV1: {
              documents: [{ url: "document.json" }],
            },
          },
          "http://localhost:3005/provider/.well-known/open-resource-discovery",
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            apiResources: [
              {
                ordId: "example:apiResource:redirected:v1",
                apiProtocol: "mcp",
                entryPoints: ["mcp"],
              },
            ],
          },
          "http://localhost:3005/provider/v2/document.json",
        ),
      );

    const result = await discoverServersFromOrd(ORD_URL);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3005/provider/document.json",
    );
    expect(result.servers).toEqual([
      expect.objectContaining({
        url: "http://localhost:3005/provider/v2/mcp",
      }),
    ]);
  });

  it("rejects described-system base URLs with query parameters", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          openResourceDiscoveryV1: {
            documents: [{ url: "/ord/v1/document" }],
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          describedSystemInstance: {
            baseUrl: "http://localhost:3005/root?tenant=one",
          },
          apiResources: [
            {
              ordId: "example:apiResource:invalid-base:v1",
              apiProtocol: "mcp",
              entryPoints: ["/mcp"],
            },
          ],
        }),
      );

    const result = await discoverServersFromOrd(ORD_URL);

    expect(result.servers).toEqual([]);
    expect(result.issues.map((issue) => issue.message)).toEqual([
      'Expected an absolute HTTP(S) URL without a query or fragment; received "http://localhost:3005/root?tenant=one". Base-URL-relative entry points cannot be resolved.',
      'Cannot resolve base-URL-relative entry point "/mcp" because describedSystemInstance.baseUrl is missing or invalid.',
    ]);
  });

  it("skips unsupported schemes and keeps a supported secondary entry point", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          openResourceDiscoveryV1: {
            documents: [{ url: "/ord/v1/document" }],
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          apiResources: [
            {
              ordId: "example:apiResource:mixed-schemes:v1",
              apiProtocol: "mcp",
              entryPoints: ["file:///etc/passwd", "https://example.com/mcp"],
            },
          ],
        }),
      );

    const result = await discoverServersFromOrd(ORD_URL);

    expect(result.servers).toEqual([
      expect.objectContaining({ url: "https://example.com/mcp" }),
    ]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        path: "apiResources[0].entryPoints[0]",
        message:
          'Unsupported URL scheme "file:". Expected "http:", "https:", or the playground\'s internal "mock:" scheme.',
      }),
    ]);
  });

  it("reports an API resource with a missing protocol", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          openResourceDiscoveryV1: {
            documents: [{ url: "/ord/v1/document" }],
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          apiResources: [
            {
              ordId: "example:apiResource:missing-protocol:v1",
              entryPoints: ["https://example.com/mcp"],
            },
          ],
        }),
      );

    const result = await discoverServersFromOrd(ORD_URL);

    expect(result.servers).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        path: "apiResources[0].apiProtocol",
        message: "Expected a string; received undefined.",
      }),
    ]);
  });
});

function jsonResponse(value: unknown, responseUrl?: string): Response {
  const response = new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
  if (responseUrl) {
    Object.defineProperty(response, "url", { value: responseUrl });
  }
  return response;
}
