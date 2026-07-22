"use client";

import { useState, useCallback } from "react";
import { useNexusRun, useNexusSchema } from "@/hooks/api/useNexus";
import type { NexusRunResult } from "@/hooks/api/useNexus";
import { useMountEffect } from "@/hooks/useMountEffect";

/**
 * src/app/console/page.tsx
 *
 * Owner Console — Run tab.
 *
 * Layout:
 *   ┌─ Run a query ──────────────────────────────────────┐
 *   │  textarea + Execute button + history pills          │
 *   └────────────────────────────────────────────────────┘
 *   ┌─ Last trace ───────────────────────────────────────┐
 *   │  routing_mode chip · latency · tool invoked        │
 *   │  result answer                                     │
 *   │  full trace JSON (collapsible)                     │
 *   └────────────────────────────────────────────────────┘
 *   ┌─ Query history ────────────────────────────────────┐
 *   │  last 5 runs (collapsible, click to reload query)  │
 *   └────────────────────────────────────────────────────┘
 *   ┌─ Tool registry ────────────────────────────────────┐
 *   │  table of tools from ai_bridge /tools/schema       │
 *   └────────────────────────────────────────────────────┘
 */

const MAX_HISTORY = 5;

const MODE_COLORS: Record<string, string> = {
  direct:   "#34d399",
  assisted: "#0066ff",
  agentic:  "#e84040",
};

interface HistoryEntry {
  query: string;
  result: NexusRunResult;
  ranAt: string;
}

const HISTORY_KEY = "console:nexus:history";

function readHistory(): HistoryEntry[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: HistoryEntry[]): void {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // sessionStorage unavailable — silently skip
  }
}

export default function ConsolePage() {
  const [query, setQuery] = useState("");
  const [showTrace, setShowTrace] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Hydrate history from sessionStorage on mount (sync with external storage).
  useMountEffect(() => {
    const stored = readHistory();
    if (stored.length > 0) setHistory(stored);
  });

  const { mutate: run, data: runData, isPending, error: runError, reset } = useNexusRun();
  const { data: schema } = useNexusSchema();

  const handleRun = useCallback(() => {
    if (!query.trim()) return;
    reset();
    setShowTrace(false);
    run(
      { query },
      {
        onSuccess(data) {
          setHistory((prev) => {
            const entry: HistoryEntry = { query, result: data, ranAt: new Date().toISOString() };
            const next = [entry, ...prev].slice(0, MAX_HISTORY);
            writeHistory(next);
            return next;
            return [entry, ...prev].slice(0, MAX_HISTORY);
          });
        },
      },
    );
  }, [query, run, reset]);

  const modeColor = runData ? (MODE_COLORS[runData.routing_mode] ?? "#fff") : "#fff";

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-10">

      {/* ── Query input ──────────────────────────────────────────────────── */}
      <section>
        <div className="eyebrow mb-4">Run a query</div>
        <div className="flex flex-col gap-3">
          <textarea
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleRun(); }}
            placeholder="e.g. list repos for Joker5514"
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[14px] text-white/85 placeholder:text-white/25 outline-none focus:border-[#e84040]/40 transition-colors"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRun}
              disabled={isPending || !query.trim()}
              className="cs-btn-deploy px-6 py-2.5 text-[10px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Running…" : "Execute →"}
            </button>
            <span className="font-mono text-[10px] text-white/25">⌘↵ to run</span>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-white/30 hover:text-white transition-colors"
              >
                History ({history.length}) {showHistory ? "↑" : "↓"}
              </button>
            )}
          </div>
        </div>

        {runError && (
          <div className="mt-3 rounded-xl border border-[#e84040]/30 bg-[#e84040]/[0.05] px-4 py-3 font-mono text-[12px] text-[#e84040]">
            {runError instanceof Error ? runError.message : "Request failed"}
          </div>
        )}

        {/* ── Query history ───────────────────────────────────────────────── */}
        {showHistory && history.length > 0 && (
          <div className="mt-4 rounded-xl border border-white/10 overflow-hidden">
            <div className="border-b border-white/10 bg-white/[0.02] px-4 py-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">
                Recent queries
              </span>
            </div>
            <ul className="divide-y divide-white/5">
              {history.map((h, i) => (
                <li key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <button
                    type="button"
                    onClick={() => { setQuery(h.query); setShowHistory(false); }}
                    className="flex-1 text-left text-[13px] text-white/65 hover:text-white transition-colors truncate"
                    title={h.query}
                  >
                    {h.query}
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]"
                      style={{
                        color: MODE_COLORS[h.result.routing_mode] ?? "#fff",
                        borderColor: `${MODE_COLORS[h.result.routing_mode] ?? "#fff"}40`,
                      }}
                    >
                      {h.result.routing_mode}
                    </span>
                    <span className="font-mono text-[10px] text-white/25">
                      {h.result.trace.total_latency_ms}ms
                    </span>
                    <span className="font-mono text-[10px] text-white/20">
                      {new Date(h.ranAt).toLocaleTimeString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── Trace result ─────────────────────────────────────────────────── */}
      {runData && (
        <section className="rounded-2xl border border-white/10 bg-[#0a0a10] overflow-hidden">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-4 border-b border-white/10 px-5 py-4">
            <span
              className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]"
              style={{ color: modeColor, borderColor: `${modeColor}40` }}
            >
              {runData.routing_mode}
            </span>
            <span className="font-mono text-[11px] text-white/40">
              {runData.trace.total_latency_ms} ms total
              {runData.trace.bridge_latency_ms > 0 && (
                <> · {runData.trace.bridge_latency_ms} ms bridge</>
              )}
            </span>
            {runData.trace.tool_invoked && (
              <span className="font-mono text-[11px] text-white/40">
                tool: <span className="text-white/70">{runData.trace.tool_invoked}</span>
              </span>
            )}
            <span className="ml-auto font-mono text-[10px] text-white/25">
              {runData.correlation_id}
            </span>
          </div>

          {/* Answer */}
          <div className="px-5 py-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30 mb-2">
              Answer
            </div>
            <pre className="whitespace-pre-wrap text-[14px] leading-relaxed text-white/80 font-sans">
              {runData.result.answer ?? JSON.stringify(runData.result, null, 2)}
            </pre>
          </div>

          {/* Data table (for list results) */}
          {Array.isArray(runData.result.data) && runData.result.data.length > 0 && (
            <div className="border-t border-white/10 px-5 pb-5 overflow-x-auto">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30 mt-4 mb-3">
                Result data ({runData.result.data.length} items)
              </div>
              <table className="w-full border-collapse font-mono text-[12px]">
                <thead>
                  <tr className="border-b border-white/10">
                    {Object.keys(runData.result.data[0] as object).map((k) => (
                      <th key={k} className="py-2 pr-5 text-left font-medium text-white/35 uppercase tracking-[0.08em]">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(runData.result.data as Record<string, unknown>[]).map((row, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="py-2 pr-5 text-white/60 max-w-xs truncate">
                          {String(v ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Full trace toggle */}
          <div className="border-t border-white/10 px-5 py-3">
            <button
              type="button"
              onClick={() => setShowTrace((v) => !v)}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30 hover:text-white/60 transition-colors"
            >
              {showTrace ? "Hide" : "Show"} full trace JSON
            </button>
            {showTrace && (
              <pre className="mt-3 overflow-x-auto rounded-lg bg-white/[0.02] p-3 text-[11px] text-white/50 leading-relaxed">
                {JSON.stringify(runData.trace, null, 2)}
              </pre>
            )}
          </div>
        </section>
      )}

      {/* ── Tool registry ─────────────────────────────────────────────────── */}
      <section>
        <div className="eyebrow mb-4">AI Bridge — Tool Registry</div>
        {!schema ? (
          <p className="text-[14px] text-white/40">Loading tool registry…</p>
        ) : (
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">Tool</th>
                  <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">Risk</th>
                  <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">Description</th>
                  <th className="px-5 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">Approval</th>
                </tr>
              </thead>
              <tbody>
                {schema.map((tool) => (
                  <tr key={tool.name} className="border-b border-white/5 bg-[#0a0a10] hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-mono text-[12px] text-white/80">{tool.name}</td>
                    <td className="px-5 py-3">
                      <RiskChip risk={tool.risk} />
                    </td>
                    <td className="px-5 py-3 text-white/55 max-w-xs">{tool.description}</td>
                    <td className="px-5 py-3 font-mono text-[11px] text-white/35">
                      {tool.requires_approval ? "⚠ required" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Risk chip ─────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<string, string> = {
  "read-only":         "#34d399",
  "write-capable":     "#f59e0b",
  "destructive":       "#e84040",
  "billing-sensitive": "#e84040",
  "device-control":    "#8b5cf6",
  "external-public":   "#0066ff",
};

function RiskChip({ risk }: { risk: string }) {
  const color = RISK_COLORS[risk] ?? "#fff";
  return (
    <span
      className="inline-block rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]"
      style={{ color, borderColor: `${color}40` }}
    >
      {risk}
    </span>
  );
}
