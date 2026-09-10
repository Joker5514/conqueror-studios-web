import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * src/app/console/agents/[id]/layout.tsx
 *
 * Auth guard for /console/agents/[id] per AGENTS.md console rules.
 */
export default async function ConsoleAgentDetailLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  return <>{children}</>;
}
