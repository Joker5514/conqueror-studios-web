import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * src/app/console/agents/layout.tsx
 *
 * Explicit auth guard for /console/agents per AGENTS.md console rules.
 * The parent /console/layout.tsx also guards, but each sub-route
 * must guard independently.
 */
export default async function ConsoleAgentsLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  return <>{children}</>;
}
