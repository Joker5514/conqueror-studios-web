import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { tryGetSupabaseServerEnv } from "./server-env";

export async function updateSession(request: NextRequest) {
  const serverEnv = tryGetSupabaseServerEnv();

  // When Supabase is not configured (e.g. local/preview without secrets), skip
  // session refresh entirely so the site still renders instead of failing the
  // whole request from middleware with a 500.
  if (!serverEnv) {
    return NextResponse.next({ request });
  }

  const { supabaseUrl, supabaseAnonKey } = serverEnv;
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.getUser();

  return supabaseResponse;
}
