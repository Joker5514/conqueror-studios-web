import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { parseConsoleOwnerEmails } from "@/lib/console-owner-emails";
import { lookupSession, type SessionLookup } from "@/lib/supabase/session";

/**
 * Owner-console allowlist.
 *
 * CONSOLE_OWNER_EMAILS is required. An empty or missing allowlist fails
 * closed so a signed-in non-owner cannot read the waitlist, send broadcast
 * mail, inspect deployment health, or run shared Nexus and Bridge proxies.
 * Magic-link sign-in does not create accounts (`shouldCreateUser: false`);
 * this gate is the second boundary for every account that does exist.
 *
 * A deployment without Supabase configuration answers 503 (APIs) or
 * redirects to /auth with an explanation (pages). It never throws a 500.
 */

export { parseConsoleOwnerEmails };

export type ConsoleOwnerDenial = {
  ok: false;
  status: 403 | 503;
  error: string;
  code: "forbidden" | "console_unconfigured";
};

export type ConsoleOwnerDecision = { ok: true } | ConsoleOwnerDenial;

export function decideConsoleOwner(email: string | null | undefined): ConsoleOwnerDecision {
  const allowed = parseConsoleOwnerEmails(process.env.CONSOLE_OWNER_EMAILS);
  if (allowed.length === 0) {
    return {
      ok: false,
      status: 503,
      error: "Console owner allowlist is not configured",
      code: "console_unconfigured",
    };
  }
  if (!email || !allowed.includes(email.trim().toLowerCase())) {
    return {
      ok: false,
      status: 403,
      error: "Forbidden",
      code: "forbidden",
    };
  }
  return { ok: true };
}

/** Path to send a signed-in non-owner, or null when the email is allowed. */
export function consoleOwnerRedirectPath(email: string | null | undefined): string | null {
  const decision = decideConsoleOwner(email);
  if (decision.ok) return null;
  if (decision.code === "console_unconfigured") return "/auth?error=console_unconfigured";
  return "/auth?error=unauthorized";
}

export type ConsoleAccess =
  | { ok: true; user: User }
  | {
      ok: false;
      status: 401 | 403 | 503;
      code: "auth_unconfigured" | "auth_unavailable" | "unauthorized" | "forbidden" | "console_unconfigured";
      error: string;
      redirectTo: string;
    };

export function decideConsoleAccess(session: SessionLookup): ConsoleAccess {
  switch (session.state) {
    case "unconfigured":
      return {
        ok: false,
        status: 503,
        code: "auth_unconfigured",
        error: "Authentication is not configured on this deployment",
        redirectTo: "/auth?error=auth_unconfigured",
      };
    case "unavailable":
      return {
        ok: false,
        status: 503,
        code: "auth_unavailable",
        error: "Authentication service is unavailable",
        redirectTo: "/auth?error=auth_unavailable",
      };
    case "anonymous":
      return { ok: false, status: 401, code: "unauthorized", error: "Unauthorized", redirectTo: "/auth" };
    case "signed_in": {
      const decision = decideConsoleOwner(session.user.email);
      if (decision.ok) return { ok: true, user: session.user };
      return {
        ok: false,
        status: decision.status,
        code: decision.code,
        error: decision.error,
        redirectTo: consoleOwnerRedirectPath(session.user.email) ?? "/auth",
      };
    }
  }
}

export async function requireConsoleOwner(): Promise<
  | { ok: true; user: User }
  | { ok: false; response: NextResponse }
> {
  const access = decideConsoleAccess(await lookupSession());
  if (access.ok) return { ok: true, user: access.user };
  return {
    ok: false,
    response: NextResponse.json(
      { error: access.error, code: access.code },
      { status: access.status, headers: { "Cache-Control": "no-store" } },
    ),
  };
}

/**
 * Server-component guard for every layout under /console. Redirects instead
 * of rendering when the visitor is not an allowlisted owner.
 */
export async function requireConsoleOwnerPage(): Promise<User> {
  const access = decideConsoleAccess(await lookupSession());
  if (!access.ok) redirect(access.redirectTo);
  return access.user;
}
