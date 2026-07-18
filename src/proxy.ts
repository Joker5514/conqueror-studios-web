import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Shared session-refresh helper used by middleware.ts.
 * Matcher config lives only on the Next.js middleware entrypoint.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}
