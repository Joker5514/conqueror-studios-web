import { describe, expect, test } from "bun:test";
import { isBlockedCrossSiteRequest, resolveCorrelationId } from "./same-origin.ts";

const base = {
  method: "POST",
  pathname: "/api/agents",
  origin: "https://www.conqueror-studios.com",
  secFetchSite: "same-origin",
  host: "www.conqueror-studios.com",
};

describe("isBlockedCrossSiteRequest", () => {
  test("allows same-origin browser mutations", () => {
    expect(isBlockedCrossSiteRequest(base)).toBe(false);
  });

  test("blocks a mutation whose Origin is another site", () => {
    expect(isBlockedCrossSiteRequest({ ...base, origin: "https://evil.example" })).toBe(true);
  });

  test("blocks a lookalike subdomain and a different port", () => {
    expect(isBlockedCrossSiteRequest({ ...base, origin: "https://www.conqueror-studios.com.evil.example" })).toBe(true);
    expect(isBlockedCrossSiteRequest({ ...base, origin: "https://www.conqueror-studios.com:8443" })).toBe(true);
  });

  test("blocks the opaque 'null' origin (sandboxed iframes, data: URLs)", () => {
    expect(isBlockedCrossSiteRequest({ ...base, origin: "null" })).toBe(true);
  });

  test("falls back to Sec-Fetch-Site when Origin is absent", () => {
    expect(isBlockedCrossSiteRequest({ ...base, origin: null, secFetchSite: "cross-site" })).toBe(true);
    expect(isBlockedCrossSiteRequest({ ...base, origin: null, secFetchSite: "same-origin" })).toBe(false);
  });

  test("leaves non-browser clients (no Origin, no Sec-Fetch-Site) to normal auth", () => {
    expect(isBlockedCrossSiteRequest({ ...base, origin: null, secFetchSite: null })).toBe(false);
  });

  test("never blocks safe methods or non-API paths", () => {
    expect(isBlockedCrossSiteRequest({ ...base, method: "GET", origin: "https://evil.example" })).toBe(false);
    expect(isBlockedCrossSiteRequest({ ...base, pathname: "/waitlist", origin: "https://evil.example" })).toBe(false);
  });

  test("exempts signature-, secret-, and token-authenticated endpoints", () => {
    for (const pathname of ["/api/stripe/webhook", "/api/gateway", "/api/unsubscribe"]) {
      expect(isBlockedCrossSiteRequest({ ...base, pathname, origin: "https://evil.example" })).toBe(false);
    }
  });

  test("applies to DELETE and PATCH, case-insensitively", () => {
    expect(isBlockedCrossSiteRequest({ ...base, method: "delete", origin: "https://evil.example" })).toBe(true);
    expect(isBlockedCrossSiteRequest({ ...base, method: "PATCH", origin: "https://evil.example" })).toBe(true);
  });
});

describe("resolveCorrelationId", () => {
  test("reuses a well-formed caller ID", () => {
    expect(resolveCorrelationId("req_abc12345")).toBe("req_abc12345");
  });

  test("replaces malformed or oversized IDs", () => {
    expect(resolveCorrelationId("bad id with spaces")).not.toBe("bad id with spaces");
    expect(resolveCorrelationId("x".repeat(500))).toHaveLength(36);
    expect(resolveCorrelationId(null)).toHaveLength(36);
  });
});
