"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useAgent,
  useUpdateAgent,
  useRunAgent,
  useAgentRuns,
  useCloneAgent,
} from "@/hooks/api/useAgents";

const MODELS = [
  { value: "gpt-4o",           label: "GPT-4o" },
  { value: "gpt-4o-mini",      label: "GPT-4o mini" },
  { value: "claude-opus-4",    label: "Claude Opus 4" },
  { value: "claude-haiku",     label: "Claude Haiku" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "llama3-70b-8192",  label: "Llama 3 70B (Groq)" },
  { value: "grok-2",           label: "Grok 2" },
] as const;

import type { AgentRunRow } from "@/lib/agents/types";

/**
 * src/app/console/agents/[id]/page.tsx
 *
 * Owner Console — Agent detail page.
 *
 * Layout:
 *   ┌─ Back + agent name + status ───────────────────────────────┐
 *   ├─ Edit panel (collapsible) ─────────────────────────────────┤
 *   ├─ Run now ──────────────────────────────────────────────────┤
 *   │  input textarea + Execute button                           │
 *   │  result panel (answer + trace toggle)                      │
 *   ├─ Run history table ─────────────────────────────────────────┤
 *   └─────────────────────────────────────────────────────────────┘
 */

const STATUS_COLORS: Record<string, string> = {
  draft:    "#f59e0b",
  active:   "#34d399",
  archived: "#ffffff33",
};

const RUN_STATUS_COLORS: Record<string, string> = {
  done:    "#34d399",
  error:   "#e84040",
  running: "#0066ff",
};

export default function ConsoleAgentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: agent, isLoading: agentLoading, error: agentError } = useAgent(id);
  const { mutate: updateAgent, isPending: isSaving } = useUpdateAgent(id);
  const { mutate: cloneAgent, isPending: isCloning } = useCloneAgent();
  const { mutate: runAgent, isPending: isRunning, data: runResult, error: runError, reset: resetRun } = useRunAgent(id);
  const { data: runsData, isLoading: runsLoading } = useAgentRuns(id);

  // ── Edit state ──────────────────────────────────────────────────────────────
  const [showEdit, setShowEdit]           = useState(false);
  const [editName, setEditName]           = useState("");
  const [editDesc, setEditDesc]           = useState("");
  const [editPrompt, setEditPrompt]       = useState("");
  const [editModel, setEditModel]         = useState("");
  const [editTools, setEditTools]         = useState("");
  const [editStatus, setEditStatus]       = useState<"draft" | "active" | "archived">("draft");

  // ── Run state ───────────────────────────────────────────────────────────────
  const [runInput, setRunInput]           = useState("");
  const [showTrace, setShowTrace]         = useState(false);
  const [expandedRun, setExpandedRun]     = useState<string | null>(null);

  function openEdit() {
    if (!agent) return;
    setEditName(agent.name);
    setEditDesc(agent.description ?? "");
    setEditPrompt(agent.system_prompt);
    setEditModel(agent.model);
    setEditTools(agent.tools.join(", "));
    setEditStatus(agent.status);
    setShowEdit(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateAgent(
      {
        name:          editName.trim(),
        description:   editDesc.trim() || undefined,
        system_prompt: editPrompt,
        model:         editModel.trim(),
        tools:         editTools.split(",").map((t) => t.trim()).filter(Boolean),
        status:        editStatus,
      },
      { onSuccess: () => setShowEdit(false) },
    );
  }

  const handleRun = useCallback(() => {
    if (!runInput.trim()) return;
    resetRun();
    setShowTrace(false);
    runAgent(runInput.trim());
  }, [runInput, runAgent, resetRun]);

  // ── Result parsing ──────────────────────────────────────────────────────────
  const nexusResult = runResult?.result;
  const resultAnswer =
    nexusResult &&
    typeof nexusResult.result === "object" &&
    nexusResult.result !== null &&
    "answer" in nexusResult.result
      ? String((nexusResult.result as Record<string, unknown>).answer)
      : nexusResult
      ? JSON.stringify(nexusResult.result ?? nexusResult, null, 2)
      : null;

  const routingMode =
    nexusResult && typeof nexusResult.routing_mode === "string"
      ? nexusResult.routing_mode
      : null;

  const latency = runResult?.run.latency_ms;

  if (agentLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      </div>
    );
  }

  if (agentError || !agent) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="rounded-xl border border-[#e84040]/30 bg-[#e84040]/[0.05] px-4 py-3 font-mono text-[12px] text-[#e84040]">
          {agentError instanceof Error ? agentError.message : "Agent not found."}
        </div>
        <Link href="/console/agents" className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.12em] text-white/40 hover:text-white transition-colors">
          &larr; Back to agents
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-10">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/console/agents"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30 hover:text-white transition-colors"
          >
            &larr; Agents
          </Link>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: STATUS_COLORS[agent.status] ?? "#fff" }}
            />
            <h1 className="text-[22px] font-medium tracking-tight text-white">
              {agent.name}
            </h1>
            <span
              className="font-mono text-[9px] uppercase tracking-[0.14em] rounded-full border px-2 py-0.5"
              style={{ color: STATUS_COLORS[agent.status], borderColor: `${STATUS_COLORS[agent.status]}40` }}
            >
              {agent.status}
            </span>
            <span className="font-mono text-[10px] text-white/35">{agent.model}</span>
          </div>
          {agent.description && (
            <p className="mt-1 text-[14px] text-white/50">{agent.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => agent && cloneAgent({ id: agent.id })}
            disabled={isCloning || !agent}
            title="Duplicate this agent"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/25 hover:text-white transition-colors disabled:opacity-40"
          >
            {isCloning ? "Cloning…" : "Clone"}
          </button>
          <button
            type="button"
            onClick={showEdit ? () => setShowEdit(false) : openEdit}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/35 hover:text-white transition-colors"
          >
            {showEdit ? "Cancel edit" : "Edit ✎"}
          </button>
        </div>
      </div>

      {/* ── Edit form ──────────────────────────────────────────────────────── */}
      {showEdit && (
        <form onSubmit={handleSave} className="panel-strong space-y-4 p-6">
          <div className="eyebrow mb-2">Edit agent</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <AgentField label="Name *" value={editName} onChange={setEditName} required />
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Model</span>
              <select
                value={MODELS.some((m) => m.value === editModel) ? editModel : "custom"}
                onChange={(e) => { if (e.target.value !== "custom") setEditModel(e.target.value); }}
                className="mt-2 w-full rounded-md border border-white/12 bg-[#0a0a10] px-3 py-2.5 text-[14px] text-white outline-none transition-colors focus:border-[#e84040] appearance-none cursor-pointer"
              >
                {MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
                <option value="custom">Custom…</option>
              </select>
            </label>
          </div>
          {(!MODELS.some((m) => m.value === editModel)) && (
            <AgentField label="Custom model ID" value={editModel} onChange={setEditModel} placeholder="provider/model-id" />
          )}
          <AgentField label="Description" value={editDesc} onChange={setEditDesc} />
          <AgentField
            label="System prompt"
            value={editPrompt}
            onChange={setEditPrompt}
            as="textarea"
            rows={5}
          />
          <AgentField
            label="Allowed tools (comma-separated, blank = all)"
            value={editTools}
            onChange={setEditTools}
          />
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Status</span>
            <div className="mt-2 flex gap-3">
              {(["draft", "active", "archived"] as const).map((s) => (
                <label
                  key={s}
                  className="cursor-pointer rounded-full border px-3 py-1 font-mono text-[11px] capitalize transition-colors"
                  style={
                    editStatus === s
                      ? { color: STATUS_COLORS[s], borderColor: `${STATUS_COLORS[s]}60`, background: `${STATUS_COLORS[s]}12` }
                      : { color: "#ffffff40", borderColor: "#ffffff18" }
                  }
                >
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={editStatus === s}
                    onChange={() => setEditStatus(s)}
                    className="sr-only"
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSaving || !editName.trim()}
              className="cs-btn-deploy px-6 py-2.5 text-[10px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving…" : "Save changes →"}
            </button>
          </div>
        </form>
      )}

      {/* ── System prompt preview (when not editing) ───────────────────────── */}
      {!showEdit && agent.system_prompt && (
        <section>
          <div className="eyebrow mb-3">System prompt</div>
          <div className="panel rounded-2xl p-4 font-mono text-[12px] leading-relaxed text-white/55 whitespace-pre-wrap">
            {agent.system_prompt}
          </div>
        </section>
      )}

      {/* Tool list */}
      {!showEdit && agent.tools.length > 0 && (
        <section>
          <div className="eyebrow mb-3">Allowed tools</div>
          <div className="flex flex-wrap gap-2">
            {agent.tools.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 px-3 py-0.5 font-mono text-[11px] text-white/55"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Run section ────────────────────────────────────────────────────── */}
      <section>
        <div className="eyebrow mb-4">Run agent</div>
        <div className="flex flex-col gap-3">
          <textarea
            rows={3}
            value={runInput}
            onChange={(e) => setRunInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleRun(); }}
            placeholder="Enter a task or question for this agent…"
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[14px] text-white/85 placeholder:text-white/25 outline-none focus:border-[#e84040]/40 transition-colors"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning || !runInput.trim()}
              className="cs-btn-deploy px-6 py-2.5 text-[10px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isRunning ? "Running…" : "Execute →"}
            </button>
            <span className="font-mono text-[10px] text-white/25">⌘↵ to run</span>
          </div>
        </div>

        {runError && (
          <div className="mt-3 rounded-xl border border-[#e84040]/30 bg-[#e84040]/[0.05] px-4 py-3 font-mono text-[12px] text-[#e84040]">
            {runError instanceof Error ? runError.message : "Run failed"}
          </div>
        )}

        {/* ── Run result ───────────────────────────────────────────────────── */}
        {runResult && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#0a0a10] overflow-hidden">
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-4 border-b border-white/10 px-5 py-4">
              {routingMode && (
                <span className="rounded-full border border-[#34d399]/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#34d399]">
                  {routingMode}
                </span>
              )}
              {latency != null && (
                <span className="font-mono text-[11px] text-white/40">{latency} ms</span>
              )}
              {runResult.run.correlation_id && (
                <span className="ml-auto font-mono text-[10px] text-white/20 truncate">
                  {runResult.run.correlation_id}
                </span>
              )}
            </div>
            {/* Answer */}
            <div className="px-5 py-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30 mb-2">Answer</div>
              <pre className="whitespace-pre-wrap text-[14px] leading-relaxed text-white/80 font-sans">
                {resultAnswer ?? "No answer returned."}
              </pre>
            </div>
            {/* Trace toggle */}
            {nexusResult != null && nexusResult.trace != null && (
              <div className="border-t border-white/10 px-5 py-3">
                <button
                  type="button"
                  onClick={() => setShowTrace((v) => !v)}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30 hover:text-white/60 transition-colors"
                >
                  {showTrace ? "Hide" : "Show"} trace JSON
                </button>
                {showTrace && (
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-white/[0.02] p-3 text-[11px] text-white/50 leading-relaxed">
                    {JSON.stringify(nexusResult.trace, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Run history ────────────────────────────────────────────────────── */}
      <section>
        <div className="eyebrow mb-4">
          Run history
          {runsData && (
            <span className="ml-2 font-mono text-[10px] text-white/35 normal-case tracking-normal">
              ({runsData.total})
            </span>
          )}
        </div>

        {runsLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
            ))}
          </div>
        )}

        {runsData && runsData.runs.length > 0 && (
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  {["Time", "Status", "Mode", "Latency", "Input", "Output"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runsData.runs.map((run) => (
                  <React.Fragment key={run.id}>
                    <tr
                      className="border-b border-white/5 bg-[#0a0a10] cursor-pointer hover:bg-white/[0.025] transition-colors"
                      onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                    >
                      <td className="px-4 py-3 font-mono text-[11px] text-white/40 whitespace-nowrap">
                        {new Date(run.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        <RunStatusChip status={run.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-white/45">
                        {run.routing_mode ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-white/40">
                        {run.latency_ms != null ? `${run.latency_ms}ms` : "—"}
                      </td>
                      <td className="px-4 py-3 max-w-[160px] truncate text-white/60 text-[12px]" title={run.input}>
                        {run.input}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-white/45 text-[12px]" title={run.output ?? undefined}>
                        {run.error ? (
                          <span className="text-[#e84040]">{run.error}</span>
                        ) : (
                          run.output ?? "—"
                        )}
                      </td>
                    </tr>
                    {expandedRun === run.id && run.trace && (
                      <tr className="bg-[#07070d]">
                        <td colSpan={6} className="px-5 py-4">
                          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30 mb-2">Full trace</div>
                          <pre className="overflow-x-auto rounded-lg bg-white/[0.03] p-3 text-[11px] text-white/50 leading-relaxed">
                            {JSON.stringify(run.trace, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {runsData && runsData.runs.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0a0a10] px-6 py-12 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/25">No runs yet</p>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function RunStatusChip({ status }: { status: AgentRunRow["status"] }) {
  const color = RUN_STATUS_COLORS[status] ?? "#fff";
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em]"
      style={{ color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {status}
    </span>
  );
}

let _afId = 0;

function AgentField({
  label, value, onChange, type = "text", required, as, rows, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; as?: "textarea"; rows?: number; placeholder?: string;
}) {
  const id = `af-${(++_afId).toString()}`;
  const cls = "mt-2 w-full rounded-md border border-white/12 bg-white/[0.02] px-3 py-2.5 text-[14px] text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#e84040]";
  return (
    <label htmlFor={id} className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">{label}</span>
      {as === "textarea" ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} required={required} rows={rows} placeholder={placeholder} className={cls} />
      ) : (
        <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} className={cls} />
      )}
    </label>
  );
}
