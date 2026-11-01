import type { ReactNode } from "react";
import { requireConsoleOwnerPage } from "@/lib/console-owner";

/**
 * Server-side owner guard for /console/settings. AGENTS.md requires every layout in
 * the /console subtree to run the check itself, not rely on the parent.
 */
export default async function ConsoleSettingsLayout({ children }: { children: ReactNode }) {
  await requireConsoleOwnerPage();
  return <>{children}</>;
}
