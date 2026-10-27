import { describe, expect, test } from "bun:test";
import { isHttpsUrl } from "./broadcast-url.ts";

describe("isHttpsUrl", () => {
  test("accepts https links", () => {
    expect(isHttpsUrl("https://www.conqueror-studios.com/projects")).toBe(true);
  });

  test("rejects http, javascript, and embedded credentials", () => {
    expect(isHttpsUrl("http://example.com")).toBe(false);
    expect(isHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpsUrl("https://user:pass@example.com")).toBe(false);
  });
});
