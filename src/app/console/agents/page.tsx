"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useAgents,
  useCreateAgent,
  useDeleteAgent,
  useCloneAgent,
  useRunAgent,
  useAgentRunCount,
} from "@/hooks/api/useAgents";
import type { AgentRow } from "@/lib/agents/types";

/**
 * src/app/console/agents/page.tsx
 *
 * Owner Console — Agent Studio list page.
 *
 * Features:
 *   - Agent cards with status dot, model badge, run-count badge
 *   - Inline search/filter
 *   - Create form with model dropdown
 *   - Clone (duplicate) agent with single click
 *   - Quick-run input inline on each card
 *   - Delete with confirmation
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<AgentRow["status"], string> = {
  draft:    "#f59e0b",
  active:   "#34d399",
  archived: "#ffffff33",
};

const MODELS = [
  { value: "gpt-4o",            label: "GPT-4o" },
  { value: "gpt-4o-mini",       label: "GPT-4o mini" },
  { value: "claude-opus-4",     label: "Claude Opus 4" },
  { value: "claude-haiku",      label: "Claude Haiku" },
  { value: "gemini-2.5-flash",  label: "Gemini 2.5 Flash" },
  { value: "llama3-70b-8192",   label: "Llama 3 70B (Groq)" },
  { value: "grok-2",            label: "Grok 2" },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConsoleAgentsPage() {
  const { data: agents, isLoading, error } = useAgents();
  const { mutate: createAgent, isPending: isCreating, error: createError } = useCreateAgent();
  const { mutate: deleteAgent } = useDeleteAgent();
  const { mutate: cloneAgent, isPending: isCloning } = useCloneAgent();

  // ── Form state ───────────────────────────────────────────────────────────────
  const [showForm, setShowForm]             = useState(false);
  const [name, setName]                     = useState("");
  const [description, setDescription]       = useState("");
  const [systemPrompt, setSystemPrompt]     = useState("");
  const [model, setModel]                   = useState<string>("gpt-4o");
  const [toolsInput, setToolsInput]         = useState("");

  // ── Search ───────────────────────────────────────────────────────────────────
  const [search, setSearch]                 = useState("");

  // ── Quick-run state (one per card) ───────────────────────────────────────────
  const [quickRunId, setQuickRunId]         = useState<string | null>(null);
  const [quickRunInput, setQuickRunInput]   = useState("");

  const filtered = useMemo(() => {
    if (!agents) return [];
    const q = search.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q) ||
        a.model.toLowerCase().includes(q),
    );
  }, [agents, search]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const tools = toolsInput.split(",").map((t) => t.trim()).filter(Boolean);
    createAgent(
      { name, description, system_prompt: systemPrompt, model, tools },
      {
        onSuccess() {
          setShowForm(false);
          setName(""); setDescription(""); setSystemPrompt(""); setToolsInput("");
          setModel("gpt-4o");
        },
      },
    );
  }

  function handleDelete(agent: AgentRow) {
    if (!window.confirm(`Delete "${agent.name}"? All run history will be lost.`)) return;
    deleteAgent(agent.id);
  }

  function handleClone(agent: AgentRow) {
    cloneAgent({ id: agent.id });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="eyebrow mb-1">Agent Studio</div>
          <p className="text-[13px] text-white/40">
            {agents ? `${agents.length} agent${agents.length !== 1 ? "s" : ""}` : "Loading…"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="cs-btn-deploy px-5 py-2 text-[10px]"
        >
          {showForm ? "Cancel" : "+ New Agent"}
        </button>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      {agents && agents.length > 0 && (
        <div className="relative">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name, description, or model…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[13px] text-white/80 placeholder:text-white/25 outline-none focus:border-[#e84040]/40 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-white/30 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* ── Create form ────────────────────────────────────────────────────── */}
      {showForm && (
        <form onSubmit={handleCreate} className="panel-strong space-y-4 p-6">
          <div className="eyebrow mb-2">New agent</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <AgentField label="Name *" value={name} onChange={setName} required />
            {/* Model dropdown */}
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Model</span>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-2 w-full rounded-md border border-white/12 bg-[#0a0a10] px-3 py-2.5 text-[14px] text-white outline-none transition-colors focus:border-[#e84040] appearance-none cursor-pointer"
              >
                {MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
                <option value="custom">Custom…</option>
              </select>
            </label>
          </div>
          {model === "custom" && (
            <AgentField label="Custom model ID" value={model === "custom" ? "" : model} onChange={setModel} placeholder="provider/model-id" />
          )}
          <AgentField label="Description" value={description} onChange={setDescription} />
          <AgentField
            label="System prompt"
            value={systemPrompt}
            onChange={setSystemPrompt}
            as="textarea"
            rows={4}
            placeholder="You are a helpful assistant that…"
          />
          <AgentField
            label="Allowed tools (comma-separated, blank = all)"
            value={toolsInput}
            onChange={setToolsInput}
            placeholder="github_list_repos, search_web"
          />
          {createError && (
            <p className="rounded-md border border-[#e84040]/30 bg-[#e84040]/10 px-4 py-2 text-[12px] text-[#e84040]">
              {createError instanceof Error ? createError.message : "Create failed."}
            </p>
          )}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="cs-btn-deploy px-6 py-2.5 text-[10px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating…" : "Create agent →"}
            </button>
          </div>
        </form>
      )}

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-[#e84040]/30 bg-[#e84040]/[0.05] px-4 py-3 font-mono text-[12px] text-[#e84040]">
          {error instanceof Error ? error.message : "Failed to load agents."}
        </div>
      )}

      {/* ── Loading skeleton ───────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      )}

      {/* ── Agent cards ────────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isCloning={isCloning}
              quickRunId={quickRunId}
              quickRunInput={quickRunInput}
              onSetQuickRunId={setQuickRunId}
              onSetQuickRunInput={setQuickRunInput}
              onDelete={handleDelete}
              onClone={handleClone}
            />
          ))}
        </div>
      )}

      {/* ── No results from search ─────────────────────────────────────────── */}
      {agents && agents.length > 0 && filtered.length === 0 && search && (
        <div className="rounded-2xl border border-white/10 bg-[#0a0a10] px-6 py-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/25">
            No agents match &ldquo;{search}&rdquo;
          </p>
          <button type="button" onClick={() => setSearch("")} className="mt-3 font-mono text-[11px] text-white/35 hover:text-white transition-colors">
            Clear filter
          </button>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {agents && agents.length === 0 && !showForm && (
        <div className="rounded-2xl border border-white/10 bg-[#0a0a10] px-6 py-20 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/25">No agents yet</p>
          <p className="mt-2 text-[13px] text-white/35">Create your first agent to get started.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-6 cs-btn-deploy px-6 py-2.5 text-[10px]"
          >
            + Create first agent
          </button>
        </div>
      )}
    </div>
  );
}

// ── AgentCard ─────────────────────────────────────────────────────────────────

function AgentCard({
  agent,
  isCloning,
  quickRunId,
  quickRunInput,
  onSetQuickRunId,
  onSetQuickRunInput,
  onDelete,
  onClone,
}: {
  agent: AgentRow;
  isCloning: boolean;
  quickRunId: string | null;
  quickRunInput: string;
  onSetQuickRunId: (id: string | null) => void;
  onSetQuickRunInput: (v: string) => void;
  onDelete: (a: AgentRow) => void;
  onClone: (a: AgentRow) => void;
}) {
  const { data: runCount } = useAgentRunCount(agent.id);
  const { mutate: run, isPending: isRunning, data: runResult, error: runError, reset: resetRun } = useRunAgent(agent.id);
  const isExpanded = quickRunId === agent.id;

  const modelLabel = MODELS.find((m) => m.value === agent.model)?.label ?? agent.model;

  function handleQuickRun(e: React.FormEvent) {
    e.preventDefault();
    if (!quickRunInput.trim()) return;
    resetRun();
    run(quickRunInput.trim());
  }

  const answer =
    runResult?.result &&
    typeof runResult.result.result === "object" &&
    runResult.result.result !== null &&
    "answer" in runResult.result.result
      ? String((runResult.result.result as Record<string, unknown>).answer)
      : runResult
      ? JSON.stringify(runResult.result?.result ?? runResult.result, null, 2)
      : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0a10] transition-colors hover:border-white/20">
      {/* ── Card main row ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: STATUS_COLORS[agent.status] }} />
            <Link
              href={`/console/agents/${agent.id}`}
              className="text-[15px] font-medium text-white hover:text-[#e84040] transition-colors"
            >
              {agent.name}
            </Link>
            {/* Status chip */}
            <span
              className="font-mono text-[9px] uppercase tracking-[0.14em] rounded-full border px-2 py-0.5"
              style={{ color: STATUS_COLORS[agent.status], borderColor: `${STATUS_COLORS[agent.status]}40` }}
            >
              {agent.status}
            </span>
            {/* Model badge */}
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-white/45">
              {modelLabel}
            </span>
            {/* Run count badge */}
            {runCount != null && runCount > 0 && (
              <span className="rounded-full border border-[#0066ff]/30 bg-[#0066ff]/[0.06] px-2 py-0.5 font-mono text-[10px] text-[#4d9fff]">
                {runCount} run{runCount !== 1 ? "s" : ""}
              </span>
            )}
            {/* Tool count */}
            {agent.tools.length > 0 && (
              <span className="font-mono text-[10px] text-white/25">
                {agent.tools.length} tool{agent.tools.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {agent.description && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/50 truncate">{agent.description}</p>
          )}
          {agent.system_prompt && (
            <p className="mt-0.5 font-mono text-[11px] text-white/20 truncate">
              {agent.system_prompt.slice(0, 100)}{agent.system_prompt.length > 100 ? "…" : ""}
            </p>
          )}
        </div>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => {
              if (isExpanded) { onSetQuickRunId(null); onSetQuickRunInput(""); resetRun(); }
              else { onSetQuickRunId(agent.id); onSetQuickRunInput(""); resetRun(); }
            }}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/35 hover:text-[#34d399] transition-colors"
          >
            {isExpanded ? "Close ↑" : "▶ Run"}
          </button>
          <button
            type="button"
            onClick={() => onClone(agent)}
            disabled={isCloning}
            title="Duplicate this agent"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/25 hover:text-white transition-colors disabled:opacity-40"
          >
            Clone
          </button>
          <Link
            href={`/console/agents/${agent.id}`}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/35 hover:text-white transition-colors"
          >
            Open →
          </Link>
          <button
            type="button"
            onClick={() => onDelete(agent)}
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/20 hover:text-[#e84040] transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* ── Quick-run panel ───────────────────────────────────────────────── */}
      {isExpanded && (
        <div className="border-t border-white/8 px-5 pb-5 pt-4 space-y-3">
          <form onSubmit={handleQuickRun} className="flex gap-2">
            <input
              type="text"
              value={quickRunInput}
              onChange={(e) => onSetQuickRunInput(e.target.value)}
              placeholder="Enter a task for this agent…"
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white/85 placeholder:text-white/25 outline-none focus:border-[#e84040]/40 transition-colors"
              autoFocus
            />
            <button
              type="submit"
              disabled={isRunning || !quickRunInput.trim()}
              className="cs-btn-deploy px-4 py-2 text-[10px] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isRunning ? "…" : "Run →"}
            </button>
          </form>

          {runError && (
            <p className="font-mono text-[11px] text-[#e84040]">
              {runError instanceof Error ? runError.message : "Run failed"}
            </p>
          )}

          {answer && (
            <div className="rounded-lg border border-white/8 bg-white/[0.02] px-4 py-3">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/30 mb-1.5">
                {runResult?.run.routing_mode ?? "result"}
                {runResult?.run.latency_ms != null && (
                  <span className="ml-2 text-white/20">{runResult.run.latency_ms}ms</span>
                )}
              </div>
              <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/70 font-sans max-h-48 overflow-y-auto">
                {answer}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="border-t border-white/5 px-5 py-2 font-mono text-[10px] text-white/20">
        Created {new Date(agent.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </div>
    </div>
  );
}

// ── Field helper ──────────────────────────────────────────────────────────────

function AgentField({
  label, value, onChange, type = "text", required, as, rows, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; as?: "textarea"; rows?: number; placeholder?: string;
}) {
  const cls = "mt-2 w-full rounded-md border border-white/12 bg-white/[0.02] px-3 py-2.5 text-[14px] text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#e84040]";
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">{label}</span>
      {as === "textarea" ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} required={required} rows={rows} placeholder={placeholder} className={cls} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} className={cls} />
      )}
    </label>
  );
}
