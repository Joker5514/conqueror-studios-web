import type { ReactNode } from "react";
import { requireConsoleOwnerPage } from "@/lib/console-owner";

/**
 * Server-side owner guard for /console/agents. AGENTS.md requires every layout in
 * the /console subtree to run the check itself, not rely on the parent.
 */
export default async function ConsoleAgentsLayout({ children }: { children: ReactNode }) {
  await requireConsoleOwnerPage();
  return <>{children}</>;
}
