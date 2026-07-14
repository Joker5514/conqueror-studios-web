"use client";

import { useConsoleWaitlist } from "@/hooks/api/useConsoleWaitlist";

/**
 * src/app/console/waitlist/page.tsx
 *
 * Owner Console — Waitlist sub-page.
 * Displays all waitlist signups in a sortable table with interest chips.
 */

export default function ConsoleWaitlistPage() {
  const { data, isLoading, error, refetch } = useConsoleWaitlist();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="eyebrow mb-1">Waitlist</div>
          <p className="text-[13px] text-white/40">
            {data ? `${data.total} signup${data.total !== 1 ? "s" : ""}` : "Loading…"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30 transition-colors hover:text-white"
        >
          Refresh ↺
        </button>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-[#e84040]/30 bg-[#e84040]/[0.05] px-4 py-3 font-mono text-[12px] text-[#e84040]">
          {error instanceof Error ? error.message : "Failed to load waitlist."}
        </div>
      )}

      {/* ── Loading skeleton ───────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-lg bg-white/[0.04]"
            />
          ))}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {data && data.rows.length > 0 && (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {["Date", "Name", "Email", "Org", "Interests", "Message"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/35"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/5 bg-[#0a0a10] transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3 font-mono text-[11px] text-white/40 whitespace-nowrap">
                    {new Date(row.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-white/80 whitespace-nowrap">
                    {row.name ?? <span className="text-white/25">—</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-white/65">
                    {row.email}
                  </td>
                  <td className="px-4 py-3 text-white/55 whitespace-nowrap">
                    {row.org ?? <span className="text-white/25">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(row.interests ?? []).map((i) => (
                        <span
                          key={i}
                          className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-white/50"
                        >
                          {i}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs text-white/45 truncate text-[12px]" title={row.message ?? undefined}>
                    {row.message ?? <span className="text-white/25">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {data && data.rows.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0a0a10] px-6 py-16 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/25">
            No signups yet
          </p>
        </div>
      )}
    </div>
  );
}
