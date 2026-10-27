import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Owner-console allowlist.
 *
 * CONSOLE_OWNER_EMAILS is required. An empty or missing allowlist fails
 * closed so a signed-in non-owner cannot read the waitlist, send broadcast
 * mail, inspect deployment health, or run shared Nexus and Bridge proxies.
 * Magic-link sign-in does not create accounts (`shouldCreateUser: false`);
 * this gate is the second boundary for every account that does exist.
 */

export type ConsoleOwnerDenial = {
  ok: false;
  status: 403 | 503;
  error: string;
  code: "forbidden" | "console_unconfigured";
};

export type ConsoleOwnerDecision = { ok: true } | ConsoleOwnerDenial;

export function parseConsoleOwnerEmails(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

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

export async function requireConsoleOwner(): Promise<
  | { ok: true; user: User }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized", code: "unauthorized" },
        { status: 401 },
      ),
    };
  }
  const decision = decideConsoleOwner(user.email);
  if (!decision.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: decision.error, code: decision.code },
        { status: decision.status },
      ),
    };
  }
  return { ok: true, user };
}
