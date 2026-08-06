"use client";

import { useState, use } from "react";
import Link from "next/link";

/**
 * src/app/unsubscribe/UnsubscribeForm.tsx
 *
 * Client component — handles the unsubscribe form + POST /api/unsubscribe.
 * Pre-fills the email from the ?email= query param when present.
 */

export function UnsubscribeForm({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = use(searchParams);
  const prefill = params.email ?? "";

  const [email, setEmail] = useState(prefill);
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: import("react").FormEvent) {
    e.preventDefault();
    setStatus("pending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setErrorMsg(data.error ?? `Request failed: ${res.status}`);
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setErrorMsg("Network error — please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="panel-strong p-8">
        <span className="eyebrow">Done</span>
        <h2 className="mt-3 text-2xl font-medium tracking-tight text-white">
          You&apos;ve been removed.
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-white/55">
          <span className="font-mono text-white/75">{email}</span> has been
          removed from the Conqueror Studios waitlist. You won&apos;t receive
          further broadcast emails.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-[#e84040] hover:underline"
        >
          &larr; Back to the lab
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="panel-strong space-y-5 p-8">
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
          Email address
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-2 w-full rounded-md border border-white/12 bg-white/[0.02] px-3 py-2.5 text-[14px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#e84040]"
        />
      </label>

      {status === "error" && (
        <p className="rounded-md border border-[#e84040]/30 bg-[#e84040]/10 px-4 py-3 text-[13px] text-[#e84040]">
          {errorMsg}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 pt-2">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/30 hover:text-white transition-colors"
        >
          &larr; Cancel
        </Link>
        <button
          type="submit"
          disabled={status === "pending"}
          className="cs-btn-deploy px-6 py-2.5 text-[10px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === "pending" ? "Removing…" : "Unsubscribe →"}
        </button>
      </div>
    </form>
  );
}
