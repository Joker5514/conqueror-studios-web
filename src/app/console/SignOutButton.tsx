"use client";

import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-white/30 transition-colors hover:text-[#e84040]"
    >
      Sign out
    </button>
  );
}
