import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * src/app/console/waitlist/layout.tsx
 *
 * Explicit auth guard for the /console/waitlist sub-route.
 * The parent /console/layout.tsx already guards the subtree, but AGENTS.md
 * requires every layout.tsx in this subtree to perform its own check.
 */
export default async function ConsoleWaitlistLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  return <>{children}</>;
}
