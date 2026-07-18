import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import ConsoleTabs from "./ConsoleTabs";

/**
 * src/app/console/layout.tsx
 *
 * Server-component auth guard for every route under /console.
 * Unauthenticated visitors are redirected to /auth.
 * Optional CONSOLE_OWNER_EMAILS (comma-separated) restricts access further.
 *
 * Architecture rule (AGENTS.md):
 *   "Every layout.tsx in this subtree must perform a server-side
 *    Supabase session check and redirect unauthenticated visitors."
 */
function isOwnerEmail(email: string | undefined): boolean {
  const raw = process.env.CONSOLE_OWNER_EMAILS?.trim();
  if (!raw) return true; // no allowlist configured — any authenticated user
  if (!email) return false;
  const allowed = raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  if (!isOwnerEmail(user.email)) {
    redirect("/auth?error=unauthorized");
  }

  return (
    <div className="min-h-screen">
      {/* Console chrome — thin top bar distinguishing it from the public site */}
      <div className="sticky top-14 z-40 border-b border-[#e84040]/20 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex h-10 max-w-7xl items-center gap-4 px-6">
          <span className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-[#e84040]">
            Owner Console
          </span>
          <ConsoleTabs />
          <span className="ml-auto font-mono text-[10px] text-white/30 hidden sm:block">
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </div>
      {children}
    </div>
  );
}
