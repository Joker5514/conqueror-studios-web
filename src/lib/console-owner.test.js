import { afterEach, describe, expect, test } from "bun:test";
import {
  consoleOwnerRedirectPath,
  decideConsoleOwner,
  parseConsoleOwnerEmails,
} from "./console-owner.ts";

describe("parseConsoleOwnerEmails", () => {
  test("returns an empty list when unset", () => {
    expect(parseConsoleOwnerEmails(undefined)).toEqual([]);
    expect(parseConsoleOwnerEmails("  ")).toEqual([]);
  });

  test("trims and lowercases entries", () => {
    expect(parseConsoleOwnerEmails(" A@Lab.dev, b@lab.dev ,, ")).toEqual([
      "a@lab.dev",
      "b@lab.dev",
    ]);
  });
});

describe("decideConsoleOwner", () => {
  const prev = process.env.CONSOLE_OWNER_EMAILS;

  afterEach(() => {
    if (prev === undefined) delete process.env.CONSOLE_OWNER_EMAILS;
    else process.env.CONSOLE_OWNER_EMAILS = prev;
  });

  test("fails closed when the allowlist is missing", () => {
    delete process.env.CONSOLE_OWNER_EMAILS;
    const decision = decideConsoleOwner("owner@example.com");
    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.status).toBe(503);
      expect(decision.code).toBe("console_unconfigured");
    }
  });

  test("fails closed when the allowlist is only commas", () => {
    process.env.CONSOLE_OWNER_EMAILS = " , , ";
    const decision = decideConsoleOwner("owner@example.com");
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.status).toBe(503);
  });

  test("rejects an authenticated email that is not listed", () => {
    process.env.CONSOLE_OWNER_EMAILS = "owner@example.com";
    const decision = decideConsoleOwner("other@example.com");
    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.status).toBe(403);
      expect(decision.code).toBe("forbidden");
    }
  });

  test("rejects a session with no email", () => {
    process.env.CONSOLE_OWNER_EMAILS = "owner@example.com";
    expect(decideConsoleOwner(undefined).ok).toBe(false);
  });

  test("allows a listed email regardless of case", () => {
    process.env.CONSOLE_OWNER_EMAILS = "Owner@Example.com";
    expect(decideConsoleOwner("owner@example.com").ok).toBe(true);
  });
});

describe("consoleOwnerRedirectPath", () => {
  const prev = process.env.CONSOLE_OWNER_EMAILS;

  afterEach(() => {
    if (prev === undefined) delete process.env.CONSOLE_OWNER_EMAILS;
    else process.env.CONSOLE_OWNER_EMAILS = prev;
  });

  test("points a missing allowlist at the configuration error", () => {
    delete process.env.CONSOLE_OWNER_EMAILS;
    expect(consoleOwnerRedirectPath("owner@example.com")).toBe(
      "/auth?error=console_unconfigured",
    );
  });

  test("returns null for an allowed owner", () => {
    process.env.CONSOLE_OWNER_EMAILS = "owner@example.com";
    expect(consoleOwnerRedirectPath("owner@example.com")).toBeNull();
  });
});
