import { describe, expect, test } from "bun:test";
import { readServerHttpUrl } from "./server-url.ts";

describe("readServerHttpUrl", () => {
  test("rejects a missing value instead of inventing localhost", () => {
    expect(readServerHttpUrl(undefined)).toEqual({ ok: false, reason: "missing" });
    expect(readServerHttpUrl("  ")).toEqual({ ok: false, reason: "missing" });
  });

  test("allows loopback http for local services", () => {
    expect(readServerHttpUrl("http://localhost:8000")).toEqual({
      ok: true,
      href: "http://localhost:8000",
    });
  });

  test("rejects non-local http", () => {
    expect(readServerHttpUrl("http://nexus.example.com/run")).toEqual({
      ok: false,
      reason: "insecure",
    });
  });

  test("accepts https and drops a trailing slash", () => {
    expect(readServerHttpUrl("https://nexus.example.com/")).toEqual({
      ok: true,
      href: "https://nexus.example.com",
    });
  });

  test("rejects credentials embedded in the URL", () => {
    expect(readServerHttpUrl("https://user:secret@nexus.example.com")).toEqual({
      ok: false,
      reason: "invalid",
    });
  });
});
