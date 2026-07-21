"use client";

import { useState } from "react";
import Link from "next/link";
import { useAgents, useCreateAgent, useDeleteAgent } from "@/hooks/api/useAgents";
import type { AgentRow } from "@/lib/agents/types";

/**
 * src/app/console/agents/page.tsx
 *
 * Owner Console — Agents tab.
 * Lists all agent definitions and provides a create form.
 */

const STATUS_COLORS: Record<AgentRow["status"], string> = {
  draft:    "#f59e0b",
  active:   "#34d399",
  archived: "#ffffff33",
};

export default function ConsoleAgentsPage() {
  const { data: agents, isLoading, error } = useAgents();
  const { mutate: createAgent, isPending: isCreating, error: createError } = useCreateAgent();
  const { mutate: deleteAgent } = useDeleteAgent();

  const [showForm, setShowForm] = useState(false);
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [model, setModel]             = useState("gpt-4o");
  const [toolsInput, setToolsInput]   = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const tools = toolsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    createAgent(
      { name, description, system_prompt: systemPrompt, model, tools },
      {
        onSuccess() {
          setShowForm(false);
          setName(""); setDescription(""); setSystemPrompt(""); setToolsInput("");
        },
      },
    );
  }

  function handleDelete(agent: AgentRow) {
    if (!window.confirm(`Delete agent "${agent.name}"? All run history will be lost.`)) return;
    deleteAgent(agent.id);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-10">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
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

      {/* ── Create form ────────────────────────────────────────────────────── */}
      {showForm && (
        <form onSubmit={handleCreate} className="panel-strong space-y-4 p-6">
          <div className="eyebrow mb-2">New agent</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <AgentField label="Name *" value={name} onChange={setName} required />
            <AgentField label="Model" value={model} onChange={setModel} />
          </div>
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
            label="Allowed tools (comma-separated, leave blank for all)"
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
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      )}

      {/* ── Agent list ─────────────────────────────────────────────────────── */}
      {agents && agents.length > 0 && (
        <div className="space-y-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="group relative rounded-2xl border border-white/10 bg-[#0a0a10] p-5 transition-colors hover:border-white/20"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: STATUS_COLORS[agent.status] }}
                    />
                    <Link
                      href={`/console/agents/${agent.id}`}
                      className="text-[15px] font-medium text-white hover:text-[#e84040] transition-colors"
                    >
                      {agent.name}
                    </Link>
                    <span
                      className="font-mono text-[9px] uppercase tracking-[0.14em] rounded-full border px-2 py-0.5"
                      style={{ color: STATUS_COLORS[agent.status], borderColor: `${STATUS_COLORS[agent.status]}40` }}
                    >
                      {agent.status}
                    </span>
                    <span className="font-mono text-[10px] text-white/30">{agent.model}</span>
                    {agent.tools.length > 0 && (
                      <span className="font-mono text-[10px] text-white/30">
                        {agent.tools.length} tool{agent.tools.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {agent.description && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-white/50 truncate">
                      {agent.description}
                    </p>
                  )}
                  {agent.system_prompt && (
                    <p className="mt-1 font-mono text-[11px] text-white/25 truncate">
                      {agent.system_prompt.slice(0, 120)}
                      {agent.system_prompt.length > 120 ? "…" : ""}
                    </p>
                  )}
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/console/agents/${agent.id}`}
                    className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40 hover:text-white transition-colors"
                  >
                    Open →
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(agent)}
                    className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/20 hover:text-[#e84040] transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Created at */}
              <div className="mt-3 font-mono text-[10px] text-white/20">
                Created {new Date(agent.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {agents && agents.length === 0 && !showForm && (
        <div className="rounded-2xl border border-white/10 bg-[#0a0a10] px-6 py-20 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/25">
            No agents yet
          </p>
          <p className="mt-2 text-[13px] text-white/35">
            Create your first agent to get started.
          </p>
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

// ── Field helper ──────────────────────────────────────────────────────────────

function AgentField({
  label, value, onChange, type = "text", required, as, rows, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  as?: "textarea";
  rows?: number;
  placeholder?: string;
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
