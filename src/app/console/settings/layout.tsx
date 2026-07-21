import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * src/app/console/settings/layout.tsx
 *
 * Explicit auth guard for /console/settings per AGENTS.md console rules.
 */
export default async function ConsoleSettingsLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  return <>{children}</>;
}
