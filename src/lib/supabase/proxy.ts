import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { tryGetSupabaseServerEnv } from "./server-env";

function nextWithHeaders(request: NextRequest, extraHeaders?: Record<string, string>): NextResponse {
  if (!extraHeaders) return NextResponse.next({ request });
  const headers = new Headers(request.headers);
  for (const [name, value] of Object.entries(extraHeaders)) headers.set(name, value);
  return NextResponse.next({ request: { headers } });
}

export async function updateSession(request: NextRequest, extraHeaders?: Record<string, string>) {
  const serverEnv = tryGetSupabaseServerEnv();

  // When Supabase is not configured (e.g. local/preview without secrets), skip
  // session refresh entirely so the site still renders instead of failing the
  // whole request from middleware with a 500.
  if (!serverEnv) {
    return nextWithHeaders(request, extraHeaders);
  }

  const { supabaseUrl, supabaseAnonKey } = serverEnv;
  let supabaseResponse = nextWithHeaders(request, extraHeaders);

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          supabaseResponse = nextWithHeaders(request, extraHeaders);
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  try {
    await supabase.auth.getUser();
  } catch {
    // An unreachable auth service must not take down every page; route
    // handlers and layouts report it through lookupSession().
  }

  return supabaseResponse;
}
