"use client";

import { useState } from "react";
import { OTP_MESSAGES, otpOutcome } from "@/lib/auth-otp-outcome";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const supabase = createClient();
      // Do not auto-create accounts — only pre-provisioned owners can sign in.
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/console`,
        },
      });

      const outcome = otpOutcome(error);
      if (outcome.kind === "sent") {
        setStatus("sent");
      } else {
        setStatus("error");
        setErrorMsg(OTP_MESSAGES[outcome.kind]);
      }
    } catch {
      setStatus("error");
      setErrorMsg(OTP_MESSAGES.failed);
    }
  }

  if (status === "sent") {
    return (
      <div className="panel-strong p-6 text-center" role="status" aria-live="polite">
        <span className="eyebrow">Check your inbox</span>
        <p className="mt-3 text-[14px] leading-relaxed text-white/70">
          If <span className="text-white">{email.trim().toLowerCase()}</span> has console
          access, a sign-in link is on its way. Open it on this device to finish signing in.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setEmail("");
          }}
          className="mt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/35 hover:text-white transition-colors"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="panel-strong space-y-4 p-6">
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
          Email
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="mt-2 w-full rounded-md border border-white/12 bg-white/[0.02] px-3 py-2.5 text-[14px] text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#e84040]"
        />
      </label>

      {status === "error" && (
        <p
          role="alert"
          className="rounded-md border border-[#e84040]/30 bg-[#e84040]/10 px-4 py-3 text-[13px] text-[#e84040]"
        >
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading" || !email.trim()}
        className="cs-btn-deploy w-full justify-center py-3 text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Sending…" : "Send magic link"}
      </button>
    </form>
  );
}
