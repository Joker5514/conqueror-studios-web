"use client";

import { useState } from "react";
import { useConsoleSettings, useConsoleBroadcast } from "@/hooks/api/useConsoleSettings";

/**
 * src/app/console/settings/page.tsx
 *
 * Owner Console — Settings tab.
 * Shows env var health, deploy metadata, and a broadcast email composer.
 */

const ENV_LABELS: Record<string, string> = {
  supabase_url:          "Supabase URL",
  supabase_anon_key:     "Supabase Anon Key",
  supabase_service_key:  "Supabase Service Key",
  postmark_token:        "Postmark Token",
  postmark_from_email:   "Postmark From Email",
  stripe_secret_key:     "Stripe Secret Key",
  stripe_webhook_secret: "Stripe Webhook Secret",
  nexus_url:             "Nexus URL",
  bridge_url:            "Bridge URL",
};

export default function ConsoleSettingsPage() {
  const { data, isLoading, error } = useConsoleSettings();
  const { mutate: broadcast, isPending: isBroadcasting, data: broadcastResult, error: broadcastError, reset } = useConsoleBroadcast();

  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [ctaUrl, setCtaUrl] = useState("https://conquerorstudios.dev/projects");
  const [ctaLabel, setCtaLabel] = useState("Explore the lab");

  function handleBroadcast(e: import("react").FormEvent) {
    e.preventDefault();
    reset();
    broadcast({ headline, summary, cta_url: ctaUrl, cta_label: ctaLabel });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-12">

      {/* ── Deploy info ──────────────────────────────────────────────────── */}
      <section>
        <div className="eyebrow mb-4">Deploy</div>
        {isLoading && <p className="text-[14px] text-white/40">Loading…</p>}
        {error && (
          <p className="text-[13px] text-[#e84040]">
            {error instanceof Error ? error.message : "Failed to load settings."}
          </p>
        )}
        {data && (
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:grid-cols-3">
            {[
              ["Environment", data.deploy.env_name],
              ["Region", data.deploy.region],
              ["Git SHA", data.deploy.version.slice(0, 9)],
              ["Nexus", data.deploy.nexus_url],
              ["Bridge", data.deploy.bridge_url],
              ["Version", data.deploy.version === "dev" ? "dev" : data.deploy.version.slice(0, 9)],
            ].map(([label, value]) => (
              <div key={label} className="bg-[#0a0a10] px-5 py-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30 mb-1">{label}</div>
                <div className="font-mono text-[13px] text-white truncate" title={value}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Env health ───────────────────────────────────────────────────── */}
      <section>
        <div className="eyebrow mb-4">Environment Variables</div>
        {data && (
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">Variable</th>
                  <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(ENV_LABELS).map(([key, label]) => {
                  const ok = data.env[key];
                  return (
                    <tr key={key} className="border-b border-white/5 bg-[#0a0a10]">
                      <td className="px-5 py-3 text-white/65">{label}</td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 font-mono text-[11px]"
                          style={{ color: ok ? "#34d399" : "#e84040" }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: ok ? "#34d399" : "#e84040" }}
                          />
                          {ok ? "set" : "missing"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Broadcast email ──────────────────────────────────────────────── */}
      <section>
        <div className="eyebrow mb-4">Broadcast Email</div>
        <p className="mb-6 text-[14px] text-white/45">
          Send a broadcast to every address in the waitlist. Uses the{" "}
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px]">
            broadcast-update
          </code>{" "}
          Postmark template.
        </p>

        {broadcastResult && (
          <div className="mb-5 rounded-xl border border-[#34d399]/30 bg-[#34d399]/[0.05] px-4 py-3 font-mono text-[12px] text-[#34d399]">
            Sent {broadcastResult.sent} / {broadcastResult.total}
            {broadcastResult.failed > 0 && (
              <span className="ml-2 text-[#f59e0b]">· {broadcastResult.failed} failed</span>
            )}
          </div>
        )}
        {broadcastError && (
          <div className="mb-5 rounded-xl border border-[#e84040]/30 bg-[#e84040]/[0.05] px-4 py-3 font-mono text-[12px] text-[#e84040]">
            {broadcastError instanceof Error ? broadcastError.message : "Broadcast failed."}
          </div>
        )}

        <form onSubmit={handleBroadcast} className="panel-strong space-y-4 p-6">
          <BroadcastField label="Headline" value={headline} onChange={setHeadline} required />
          <BroadcastField
            label="Summary"
            value={summary}
            onChange={setSummary}
            as="textarea"
            rows={3}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <BroadcastField label="CTA URL" value={ctaUrl} onChange={setCtaUrl} type="url" required />
            <BroadcastField label="CTA Label" value={ctaLabel} onChange={setCtaLabel} required />
          </div>
          <div className="flex items-center justify-between pt-2">
            <p className="text-[12px] text-white/35">
              This will email every address in the waitlist table.
            </p>
            <button
              type="submit"
              disabled={isBroadcasting}
              className="cs-btn-deploy px-6 py-2.5 text-[10px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isBroadcasting ? "Sending…" : "Send broadcast →"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// ── Field helper ──────────────────────────────────────────────────────────────

let _fieldId = 0;

function BroadcastField({
  label,
  value,
  onChange,
  type = "text",
  required,
  as,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  as?: "textarea";
  rows?: number;
}) {
  // Stable ID for label→control association (satisfies Biome a11y/noLabelWithoutControl).
  const id = `bf-${(++_fieldId).toString()}`;
  const cls =
    "mt-2 w-full rounded-md border border-white/12 bg-white/[0.02] px-3 py-2.5 text-[14px] text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#e84040]";
  return (
    <label htmlFor={id} className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">{label}</span>
      {as === "textarea" ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={rows}
          className={cls}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={cls}
        />
      )}
    </label>
  );
}
