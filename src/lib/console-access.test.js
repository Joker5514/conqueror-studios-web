import { afterEach, describe, expect, test } from "bun:test";
import { decideConsoleAccess } from "./console-owner.ts";

const prev = process.env.CONSOLE_OWNER_EMAILS;
afterEach(() => {
  if (prev === undefined) delete process.env.CONSOLE_OWNER_EMAILS;
  else process.env.CONSOLE_OWNER_EMAILS = prev;
});

const owner = { id: "u1", email: "Owner@Example.com" };
const stranger = { id: "u2", email: "other@example.com" };

describe("decideConsoleAccess", () => {
  test("unconfigured auth is a 503 that sends pages to an explanation, not a crash", () => {
    const access = decideConsoleAccess({ state: "unconfigured" });
    expect(access.ok).toBe(false);
    if (!access.ok) {
      expect(access.status).toBe(503);
      expect(access.code).toBe("auth_unconfigured");
      expect(access.redirectTo).toBe("/auth?error=auth_unconfigured");
    }
  });

  test("an unreachable auth service is a 503, not anonymous", () => {
    const access = decideConsoleAccess({ state: "unavailable" });
    expect(access.ok).toBe(false);
    if (!access.ok) {
      expect(access.status).toBe(503);
      expect(access.code).toBe("auth_unavailable");
    }
  });

  test("anonymous visitors get 401 and the sign-in page", () => {
    process.env.CONSOLE_OWNER_EMAILS = "owner@example.com";
    const access = decideConsoleAccess({ state: "anonymous" });
    expect(access.ok).toBe(false);
    if (!access.ok) {
      expect(access.status).toBe(401);
      expect(access.redirectTo).toBe("/auth");
    }
  });

  test("an allowlisted owner is admitted (case-insensitive)", () => {
    process.env.CONSOLE_OWNER_EMAILS = "owner@example.com";
    const access = decideConsoleAccess({ state: "signed_in", user: owner });
    expect(access.ok).toBe(true);
  });

  test("a signed-in non-owner is forbidden", () => {
    process.env.CONSOLE_OWNER_EMAILS = "owner@example.com";
    const access = decideConsoleAccess({ state: "signed_in", user: stranger });
    expect(access.ok).toBe(false);
    if (!access.ok) {
      expect(access.status).toBe(403);
      expect(access.redirectTo).toBe("/auth?error=unauthorized");
    }
  });

  test("an empty allowlist fails closed even for a signed-in user", () => {
    delete process.env.CONSOLE_OWNER_EMAILS;
    const access = decideConsoleAccess({ state: "signed_in", user: owner });
    expect(access.ok).toBe(false);
    if (!access.ok) {
      expect(access.status).toBe(503);
      expect(access.code).toBe("console_unconfigured");
    }
  });
});
