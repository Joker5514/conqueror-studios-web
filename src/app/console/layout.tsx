import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

/**
 * src/app/console/layout.tsx
 *
 * Server-component auth guard for every route under /console.
 * Unauthenticated visitors are redirected to /waitlist.
 *
 * Architecture rule (AGENTS.md):
 *   "Every layout.tsx in this subtree must perform a server-side
 *    Supabase session check and redirect unauthenticated visitors."
 */
export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/waitlist");
  }

  return (
    <div className="min-h-screen">
      {/* Console chrome — thin top bar distinguishing it from the public site */}
      <div className="sticky top-14 z-40 border-b border-[#e84040]/20 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex h-10 max-w-7xl items-center gap-4 px-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#e84040]">
            Owner Console
          </span>
          <span className="font-mono text-[10px] text-white/30">
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </div>
      {children}
    </div>
  );
}
