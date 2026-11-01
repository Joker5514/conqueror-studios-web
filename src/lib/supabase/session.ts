import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tryGetSupabaseServerEnv } from "@/lib/supabase/server-env";
import type { User } from "@supabase/supabase-js";

export type SessionLookup =
  | { state: "unconfigured" }
  | { state: "unavailable" }
  | { state: "anonymous" }
  | { state: "signed_in"; user: User };

type AuthErrorLike = { name?: string; status?: number } | null | undefined;

function isAuthServiceFailure(error: AuthErrorLike): boolean {
  if (!error) return false;
  if (error.name === "AuthRetryableFetchError") return true;
  return typeof error.status === "number" && (error.status === 0 || error.status >= 500);
}

/**
 * Resolve the current Supabase session without throwing. `connection()` keeps
 * every caller request-time rendered, so an auth-gated page is never
 * prerendered at build time when the build happens to lack Supabase env.
 */
export async function lookupSession(): Promise<SessionLookup> {
  await connection();
  if (!tryGetSupabaseServerEnv()) return { state: "unconfigured" };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (data.user) return { state: "signed_in", user: data.user };
    if (isAuthServiceFailure(error)) return { state: "unavailable" };
    return { state: "anonymous" };
  } catch {
    return { state: "unavailable" };
  }
}
