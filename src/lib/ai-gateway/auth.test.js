import { describe, expect, test } from "bun:test";
import { secretsEqual } from "./auth.ts";

describe("secretsEqual", () => {
  test("matches identical secrets", () => {
    expect(secretsEqual("gateway-secret-value", "gateway-secret-value")).toBe(true);
  });

  test("rejects different secrets of same length", () => {
    expect(secretsEqual("aaaaaaaa", "bbbbbbbb")).toBe(false);
  });

  test("rejects different lengths without throwing", () => {
    expect(secretsEqual("short", "much-longer-secret")).toBe(false);
  });
});
