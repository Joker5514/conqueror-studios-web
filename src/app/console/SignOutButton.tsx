"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setErrorMsg(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        setErrorMsg(error.message);
        setPending(false);
        return;
      }
      window.location.href = "/auth";
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Sign-out failed");
      setPending(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      {errorMsg && (
        <span role="alert" className="font-mono text-[10px] text-[#e84040] max-w-[10rem] truncate" title={errorMsg}>
          {errorMsg}
        </span>
      )}
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={pending}
        className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-white/30 transition-colors hover:text-[#e84040] disabled:opacity-50"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </span>
  );
}
