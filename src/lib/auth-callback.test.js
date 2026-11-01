import { describe, expect, test } from "bun:test";
import { getSafeRedirectPath } from "../app/auth/callback/route.ts";

const origin = new URL("https://www.conqueror-studios.com/auth/callback?code=x");

describe("getSafeRedirectPath (open-redirect guard)", () => {
  test("keeps same-origin paths and their query", () => {
    expect(getSafeRedirectPath(origin, "/console")).toBe("/console");
    expect(getSafeRedirectPath(origin, "/console/agents?tab=runs")).toBe("/console/agents?tab=runs");
  });

  test("rejects absolute and protocol-relative URLs to other hosts", () => {
    expect(getSafeRedirectPath(origin, "https://evil.example")).toBe("/");
    expect(getSafeRedirectPath(origin, "//evil.example/path")).toBe("/");
    expect(getSafeRedirectPath(origin, "/\\evil.example")).toBe("/");
  });

  test("rejects non-http schemes and empty values", () => {
    expect(getSafeRedirectPath(origin, "javascript:alert(1)")).toBe("/");
    expect(getSafeRedirectPath(origin, null)).toBe("/");
  });
});
