import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tryGetSupabaseServerEnv } from "@/lib/supabase/server-env";

export function getSafeRedirectPath(requestUrl: URL, nextPath: string | null): string {
  if (!nextPath) {
    return "/";
  }

  try {
    const candidateUrl = new URL(nextPath, requestUrl.origin);
    if (candidateUrl.origin !== requestUrl.origin) {
      return "/";
    }
    if (!candidateUrl.pathname.startsWith("/")) {
      return "/";
    }

    return `${candidateUrl.pathname}${candidateUrl.search}`;
  } catch {
    return "/";
  }
}

function toAuth(requestUrl: URL, error: string): NextResponse {
  return NextResponse.redirect(new URL(`/auth?error=${error}`, requestUrl.origin));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  if (!tryGetSupabaseServerEnv()) {
    return toAuth(requestUrl, "auth_unconfigured");
  }

  // Supabase sends expired or reused links back with error parameters.
  const code = requestUrl.searchParams.get("code");
  if (!code || requestUrl.searchParams.has("error")) {
    return toAuth(requestUrl, "link_invalid");
  }

  try {
    const supabase = await createClient({ allowCookieWriteFailure: false });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return toAuth(requestUrl, "link_invalid");
    }
  } catch {
    return toAuth(requestUrl, "auth_unavailable");
  }

  const nextPath = getSafeRedirectPath(requestUrl, requestUrl.searchParams.get("next"));
  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
