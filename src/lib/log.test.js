import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { log, redactString, sanitize } from "./log.ts";

describe("redactString", () => {
  test("masks email local parts", () => {
    expect(redactString("Key (email)=(jane.doe@example.com) already exists")).toBe(
      "Key (email)=(***@example.com) already exists",
    );
  });

  test("removes token-shaped strings", () => {
    const fakeStripe = ["sk", "live", "abcdefghijklmnop1234"].join("_");
    const fakeGithub = `ghp_${"a".repeat(36)}`;
    const fakeJwt = `eyJ${"a".repeat(12)}.${"b".repeat(12)}.${"c".repeat(12)}`;
    const out = redactString(`${fakeStripe} ${fakeGithub} ${fakeJwt}`);
    expect(out).toBe("[redacted] [redacted] [redacted]");
  });

  test("truncates very long strings", () => {
    expect(redactString("x".repeat(2000)).length).toBeLessThanOrEqual(501);
  });
});

describe("sanitize", () => {
  test("replaces credential-like keys anywhere in the object", () => {
    const out = sanitize({
      apiKey: "abc",
      nested: { authorization: "Bearer x", service_role: "y", ok: 1 },
      list: [{ password: "p" }],
    });
    expect(out).toEqual({
      apiKey: "[redacted]",
      nested: { authorization: "[redacted]", service_role: "[redacted]", ok: 1 },
      list: [{ password: "[redacted]" }],
    });
  });

  test("reduces errors to name, message, and code", () => {
    const err = Object.assign(new Error("failed for a@b.co"), { code: "23505", stack: "secret stack" });
    expect(sanitize(err)).toEqual({ name: "Error", message: "failed for ***@b.co", code: "23505" });
  });

  test("bounds depth and list length", () => {
    const deep = { a: { b: { c: { d: { e: 1 } } } } };
    expect(JSON.stringify(sanitize(deep))).toContain("[truncated]");
    expect(sanitize(Array.from({ length: 50 }, (_, i) => i))).toHaveLength(20);
  });
});

describe("log", () => {
  let lines;
  let original;
  beforeEach(() => {
    lines = [];
    original = { log: console.log, error: console.error, warn: console.warn };
    console.log = (line) => lines.push(line);
    console.error = (line) => lines.push(line);
    console.warn = (line) => lines.push(line);
  });
  afterEach(() => {
    console.log = original.log;
    console.error = original.error;
    console.warn = original.warn;
  });

  test("writes one JSON object per line with redacted fields", () => {
    log.error("waitlist.insert_failed", { code: "XX000", email: "jane@example.com", token: "t" });
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.level).toBe("error");
    expect(parsed.event).toBe("waitlist.insert_failed");
    expect(parsed.email).toBe("***@example.com");
    expect(parsed.token).toBe("[redacted]");
    expect(typeof parsed.ts).toBe("string");
  });
});
