"use client";

import { useState, useCallback } from "react";
import { useState } from "react";
import { useConsoleWaitlist } from "@/hooks/api/useConsoleWaitlist";

/**
 * src/app/console/waitlist/page.tsx
 *
 * Owner Console — Waitlist sub-page.
 * Displays waitlist signups with pagination and CSV export.
 * Displays waitlist signups with pagination.
 */

const PAGE_SIZE = 50;

function formatSignupDate(iso: string): string {
  // Explicit locale + UTC avoids SSR/browser timezone mismatches.
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function exportCsv(rows: {
  created_at: string;
  name: string | null;
  email: string;
  org: string | null;
  interests: string[] | null;
  message: string | null;
}[]): void {
  const headers = ["Date", "Name", "Email", "Org", "Interests", "Message"];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        new Date(r.created_at).toISOString(),
        escape(r.name ?? ""),
        escape(r.email),
        escape(r.org ?? ""),
        escape((r.interests ?? []).join("; ")),
        escape(r.message ?? ""),
      ].join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ConsoleWaitlistPage() {
  const [page, setPage] = useState(0);
  const offset = page * PAGE_SIZE;
  const { data, isLoading, error, refetch, isFetching } = useConsoleWaitlist(PAGE_SIZE, offset);
export default function ConsoleWaitlistPage() {
  const [page, setPage] = useState(0);
  const offset = page * PAGE_SIZE;
  const { data, isLoading, error, refetch, isFetching } = useConsoleWaitlist(
    PAGE_SIZE,
    offset,
  );

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 0;
  const canNext = (page + 1) * PAGE_SIZE < total;

  let subtitle = "Loading…";
  if (error) subtitle = "Failed to load";
  else if (data) subtitle = `${total} signup${total !== 1 ? "s" : ""}`;

  const handleExport = useCallback(() => {
    if (data?.rows) exportCsv(data.rows);
  }, [data]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="eyebrow mb-1">Waitlist</div>
          <p className="text-[13px] text-white/40">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          {data && data.rows.length > 0 && (
            <button
              type="button"
              onClick={handleExport}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30 transition-colors hover:text-white"
            >
              Export CSV ↓
            </button>
          )}
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30 transition-colors hover:text-white disabled:opacity-50"
          >
            Refresh ↺
          </button>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30 transition-colors hover:text-white disabled:opacity-50"
        >
          Refresh ↺
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[#e84040]/30 bg-[#e84040]/[0.05] px-4 py-3 font-mono text-[12px] text-[#e84040]">
          {error instanceof Error ? error.message : "Failed to load waitlist."}
        </div>
      )}

      {/* ── Loading skeleton ───────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
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
        <>
          <div className="rounded-2xl border border-white/10 overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  {["Date", "Name", "Email", "Org", "Interests", "Message"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">
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
                  <tr key={row.id} className="border-b border-white/5 bg-[#0a0a10] transition-colors hover:bg-white/[0.02]">
                  <tr
                    key={row.id}
                    className="border-b border-white/5 bg-[#0a0a10] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-white/40 whitespace-nowrap">
                      {formatSignupDate(row.created_at)}
                    </td>
                    <td className="px-4 py-3 text-white/80 whitespace-nowrap">
                      {row.name ?? <span className="text-white/25">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-white/65">{row.email}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-white/65">
                      {row.email}
                    </td>
                    <td className="px-4 py-3 text-white/55 whitespace-nowrap">
                      {row.org ?? <span className="text-white/25">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(row.interests ?? []).map((i) => (
                          <span key={i} className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-white/50">
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
                    <td
                      className="px-4 py-3 max-w-xs text-white/45 truncate text-[12px]"
                      title={row.message ?? undefined}
                    >
                      {row.message ?? <span className="text-white/25">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!canPrev || isFetching}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/50 transition-colors hover:text-white disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!canNext || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/50 transition-colors hover:text-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
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
