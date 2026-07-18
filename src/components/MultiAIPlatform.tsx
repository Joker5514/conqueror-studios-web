"use client";

import { useState, useCallback } from "react";
import { useMountEffect } from "@/hooks/useMountEffect";

// ── Types ────────────────────────────────────────────────────────────────────

type ProviderId = "perplexity" | "claude" | "openai" | "grok";

interface ProviderConfig {
  name: string;
  color: string;
  models: string[];
  endpoint: string;
}

interface WorkflowStep {
  id: number;
  provider: ProviderId;
  model: string;
  instruction: string;
  usesPreviousOutput: boolean;
  enabled: boolean;
}

interface StepResult {
  stepId: number;
  provider: ProviderId;
  model: string;
  content: string;
  timestamp: string;
}

interface SavedWorkflow {
  name: string;
  steps: WorkflowStep[];
  savedAt: string;
}

type ApiKeys = Record<ProviderId, string>;

// ── Static config (mirrors combined_backend.py pricing + MultiAIPlatform.jsx) ─

const PROVIDER_CONFIG: Record<ProviderId, ProviderConfig> = {
  perplexity: {
    name: "Perplexity",
    color: "#1D9BF0",
    models: ["sonar-pro", "sonar", "sonar-reasoning-pro"],
    endpoint: "https://api.perplexity.ai/chat/completions",
  },
  claude: {
    name: "Claude",
    color: "#D97706",
    models: ["claude-sonnet-4-5-20250929", "claude-opus-4", "claude-haiku"],
    endpoint: "https://api.anthropic.com/v1/messages",
  },
  openai: {
    name: "OpenAI",
    color: "#10A37F",
    models: ["gpt-4o", "gpt-5", "gpt-4o-mini"],
    endpoint: "https://api.openai.com/v1/chat/completions",
  },
  grok: {
    name: "Grok",
    color: "#1DA1F2",
    models: ["grok-2", "grok-1.5"],
    endpoint: "https://api.x.ai/v1/chat/completions",
  },
};

// Mirrors calculate_cost() from combined_backend.py (per-million-token rates)
const PRICING: Record<string, Record<string, { input: number; output: number }>> = {
  perplexity: {
    "sonar-pro": { input: 5.0, output: 20.0 },
    sonar: { input: 2.5, output: 10.0 },
    "sonar-reasoning-pro": { input: 5.0, output: 20.0 },
  },
  claude: {
    "claude-sonnet-4-5-20250929": { input: 3.0, output: 15.0 },
    "claude-opus-4": { input: 15.0, output: 75.0 },
    "claude-haiku": { input: 0.25, output: 1.25 },
  },
  openai: {
    "gpt-4o": { input: 2.5, output: 10.0 },
    "gpt-5": { input: 5.0, output: 15.0 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
  },
  grok: {
    "grok-2": { input: 5.0, output: 15.0 },
    "grok-1.5": { input: 3.0, output: 10.0 },
  },
};

function _calculateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number {
  const rates = PRICING[provider]?.[model] ?? { input: 0, output: 0 };
  return (inputTokens * rates.input) / 1e6 + (outputTokens * rates.output) / 1e6;
}

const DEFAULT_STEPS: WorkflowStep[] = [
  {
    id: 1,
    provider: "perplexity",
    model: "sonar-pro",
    instruction: "Research and create a comprehensive framework for this topic. Include architecture recommendations, technology stack, and key features.",
    usesPreviousOutput: false,
    enabled: true,
  },
  {
    id: 2,
    provider: "claude",
    model: "claude-sonnet-4-5-20250929",
    instruction: "Based on the research provided, create a detailed technical specification. Include schema, API endpoints, and component structure.",
    usesPreviousOutput: true,
    enabled: true,
  },
  {
    id: 3,
    provider: "openai",
    model: "gpt-4o",
    instruction: "Review the specification and create a prioritized development roadmap with estimated timelines and potential challenges.",
    usesPreviousOutput: true,
    enabled: true,
  },
];

const STORAGE_KEY = "ai_bridge_workflows";

// ── Standalone API call helper (defined outside component to avoid hoisting) ─

async function callProvider(
  provider: ProviderId,
  model: string,
  messages: { role: string; content: string }[],
  apiKey: string,
  maxRetries: number,
  attempt = 1,
): Promise<string> {
  const config = PROVIDER_CONFIG[provider];
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  let body: string;

  if (provider === "claude") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
    headers["anthropic-dangerous-direct-browser-access"] = "true";
    body = JSON.stringify({
      model,
      max_tokens: 4096,
      messages: messages.filter((m) => m.role !== "system"),
      system: messages.find((m) => m.role === "system")?.content,
    });
  } else {
    headers.Authorization = `Bearer ${apiKey}`;
    body = JSON.stringify({ model, messages, max_tokens: 4096 });
  }

  const controller = new AbortController();
  const timeoutMs = 60_000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(config.endpoint, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Request to ${provider} timed out after ${timeoutMs / 1000}s`);
    }
    // Network errors are retryable.
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      return callProvider(provider, model, messages, apiKey, maxRetries, attempt + 1);
    }
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg =
      (err as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`;
    // Only retry transient failures: rate limits and server errors.
    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < maxRetries) {
      const backoffMs = res.status === 429 ? 2000 * attempt : 1000 * attempt;
      await new Promise((r) => setTimeout(r, backoffMs));
      return callProvider(provider, model, messages, apiKey, maxRetries, attempt + 1);
    }
    throw new Error(msg);
  }

  const data = (await res.json()) as {
    content?: { text?: string }[];
    choices?: { message?: { content?: string } }[];
  };
  if (provider === "claude") {
    const text = data.content?.[0]?.text;
    if (typeof text !== "string") {
      throw new Error("Invalid or empty response structure from Claude API");
    }
    return text;
  }
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error(`Invalid or empty response structure from ${provider} API`);
  }
  return content;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MultiAIPlatform() {
  const [prompt, setPrompt] = useState("");
  const [workflow, setWorkflow] = useState<WorkflowStep[]>(DEFAULT_STEPS);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ perplexity: "", claude: "", openai: "", grok: "" });
  const [results, setResults] = useState<StepResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [executionMode, setExecutionMode] = useState<"sequential" | "parallel">("sequential");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([]);
  const [workflowName, setWorkflowName] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(3);
  const [showSaved, setShowSaved] = useState(false);

  // True external-system sync: load persisted workflows from localStorage on mount
  useMountEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSavedWorkflows(JSON.parse(saved) as SavedWorkflow[]);
      } catch {
        // corrupt storage — ignore
      }
    }
  });

  // ── Execute workflow (mirrors executeWorkflow from MultiAIPlatform.jsx) ───

  const executeWorkflow = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsExecuting(true);
    setResults([]);
    setError(null);
    setCurrentStep(0);

    const enabled = workflow.filter((s) => s.enabled);
    const stepResults: StepResult[] = [];

    try {
      if (executionMode === "sequential") {
        for (let i = 0; i < enabled.length; i++) {
          const step = enabled[i];
          setCurrentStep(i + 1);
          const key = apiKeys[step.provider];
          if (!key) throw new Error(`Missing API key for ${PROVIDER_CONFIG[step.provider].name}`);
          const prev = stepResults[stepResults.length - 1];
          const content_msg =
            step.usesPreviousOutput && prev
              ? `${step.instruction}\n\nPrevious output:\n${prev.content}`
              : `${step.instruction}\n\nUser prompt: ${prompt}`;
          const content = await callProvider(step.provider, step.model, [{ role: "user", content: content_msg }], key, retryAttempts);
          const result: StepResult = { stepId: step.id, provider: step.provider, model: step.model, content, timestamp: new Date().toISOString() };
          stepResults.push(result);
          setResults([...stepResults]);
        }
      } else {
        const parallel = await Promise.all(
          enabled.map(async (step) => {
            const key = apiKeys[step.provider];
            if (!key) throw new Error(`Missing API key for ${PROVIDER_CONFIG[step.provider].name}`);
            const content = await callProvider(step.provider, step.model, [{ role: "user", content: `${step.instruction}\n\nUser prompt: ${prompt}` }], key, retryAttempts);
            return { stepId: step.id, provider: step.provider, model: step.model, content, timestamp: new Date().toISOString() } as StepResult;
          }),
        );
        setResults(parallel);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExecuting(false);
      setCurrentStep(0);
    }
  }, [prompt, workflow, apiKeys, executionMode, retryAttempts]);

  // ── Workflow persistence ─────────────────────────────────────────────────

  const saveWorkflow = useCallback(() => {
    const wf: SavedWorkflow = { name: workflowName || `Workflow ${Date.now()}`, steps: workflow, savedAt: new Date().toISOString() };
    const updated = [...savedWorkflows, wf];
    setSavedWorkflows(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setWorkflowName("");
  }, [workflowName, workflow, savedWorkflows]);

  const loadWorkflow = useCallback((wf: SavedWorkflow) => {
    setWorkflow(wf.steps);
    setShowSaved(false);
  }, []);

  const deleteWorkflow = useCallback((index: number) => {
    const updated = savedWorkflows.filter((_, i) => i !== index);
    setSavedWorkflows(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [savedWorkflows]);

  // ── Export results ───────────────────────────────────────────────────────

  const exportResults = useCallback((format: "markdown" | "json") => {
    const text =
      format === "markdown"
        ? results.map((r) => `## Step ${r.stepId} — ${r.provider} (${r.model})\n\n${r.content}`).join("\n\n---\n\n")
        : JSON.stringify(results, null, 2);
    const mime = format === "markdown" ? "text/markdown" : "application/json";
    const ext = format === "markdown" ? "md" : "json";
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai_bridge_results.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  const copyToClipboard = useCallback((text: string, id: number) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // ── Step management ──────────────────────────────────────────────────────

  const addStep = useCallback(() => {
    setWorkflow((prev) => [
      ...prev,
      { id: Date.now(), provider: "openai", model: "gpt-4o", instruction: "", usesPreviousOutput: true, enabled: true },
    ]);
  }, []);

  const removeStep = useCallback((id: number) => {
    setWorkflow((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateStep = useCallback(<K extends keyof WorkflowStep>(id: number, key: K, value: WorkflowStep[K]) => {
    setWorkflow((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────

  const enabledCount = workflow.filter((s) => s.enabled).length;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0a10] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#e84040]">AI Bridge — Live Demo</div>
          <div className="mt-0.5 text-[13px] text-white/50">{enabledCount} step{enabledCount !== 1 ? "s" : ""} · {executionMode}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExecutionMode((m) => (m === "sequential" ? "parallel" : "sequential"))}
            className="rounded border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 transition-colors hover:border-white/20 hover:text-white/80"
          >
            {executionMode === "sequential" ? "Sequential" : "Parallel"}
          </button>
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className="rounded border border-white/10 p-1.5 text-white/40 transition-colors hover:text-white/80"
            aria-label="Settings"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3" />
              <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="border-b border-white/10 bg-white/[0.02] px-5 py-4 flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-3 text-[13px] text-white/60">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">Retry attempts</span>
            <input
              type="number"
              min={1}
              max={5}
              value={retryAttempts}
              onChange={(e) => setRetryAttempts(Math.max(1, Math.min(5, Number(e.target.value))))}
              className="w-14 rounded border border-white/10 bg-transparent px-2 py-1 text-center text-white outline-none focus:border-[#e84040]/50"
            />
          </label>
          {/* API keys */}
          {(Object.keys(PROVIDER_CONFIG) as ProviderId[]).map((pid) => (
            <label key={pid} className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: PROVIDER_CONFIG[pid].color }}>
                {PROVIDER_CONFIG[pid].name}
              </span>
              <input
                type="password"
                placeholder="API key"
                value={apiKeys[pid]}
                onChange={(e) => setApiKeys((k) => ({ ...k, [pid]: e.target.value }))}
                className="w-40 rounded border border-white/10 bg-transparent px-2 py-1 font-mono text-[11px] text-white/70 outline-none placeholder:text-white/20 focus:border-[#e84040]/50"
              />
            </label>
          ))}
        </div>
      )}

      {/* Prompt */}
      <div className="px-5 pt-5">
        <textarea
          rows={3}
          placeholder="Enter your prompt — what do you want to build or research?"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[14px] text-white/85 placeholder:text-white/25 outline-none focus:border-[#e84040]/40 transition-colors"
        />
      </div>

      {/* Workflow steps */}
      <div className="px-5 pt-4 space-y-3">
        {workflow.map((step, i) => {
          const cfg = PROVIDER_CONFIG[step.provider];
          const isActive = isExecuting && currentStep === i + 1;
          return (
            <div
              key={step.id}
              className={`rounded-xl border transition-colors ${
                isActive ? "border-[#e84040]/50 bg-[#e84040]/[0.04]" : step.enabled ? "border-white/10 bg-white/[0.02]" : "border-white/5 opacity-40"
              }`}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Step number */}
                <span
                  className="font-orbitron text-[11px] font-bold w-5 shrink-0 text-center"
                  style={{ color: isActive ? "#e84040" : "rgba(255,255,255,0.3)" }}
                >
                  {isActive ? (
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10" />
                    </svg>
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>

                {/* Provider */}
                <select
                  value={step.provider}
                  onChange={(e) => {
                    const p = e.target.value as ProviderId;
                    updateStep(step.id, "provider", p);
                    updateStep(step.id, "model", PROVIDER_CONFIG[p].models[0]);
                  }}
                  className="rounded border border-white/10 bg-[#0a0a10] px-2 py-1 font-mono text-[11px] outline-none"
                  style={{ color: cfg.color }}
                >
                  {(Object.keys(PROVIDER_CONFIG) as ProviderId[]).map((p) => (
                    <option key={p} value={p}>{PROVIDER_CONFIG[p].name}</option>
                  ))}
                </select>

                {/* Model */}
                <select
                  value={step.model}
                  onChange={(e) => updateStep(step.id, "model", e.target.value)}
                  className="rounded border border-white/10 bg-[#0a0a10] px-2 py-1 font-mono text-[11px] text-white/60 outline-none"
                >
                  {cfg.models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                {/* Chain toggle */}
                {i > 0 && (
                  <button
                    type="button"
                    aria-pressed={step.usesPreviousOutput}
                    aria-label="Chain previous step output"
                    onClick={() => updateStep(step.id, "usesPreviousOutput", !step.usesPreviousOutput)}
                    className="flex items-center gap-1.5 ml-1"
                  >
                    <span
                      className={`inline-flex w-7 h-4 rounded-full transition-colors ${step.usesPreviousOutput ? "bg-[#e84040]/70" : "bg-white/10"}`}
                      aria-hidden="true"
                    >
                      <span className={`h-3 w-3 m-0.5 rounded-full bg-white transition-transform ${step.usesPreviousOutput ? "translate-x-3" : "translate-x-0"}`} />
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/30">chain</span>
                  </button>
                )}

                <div className="ml-auto flex items-center gap-2">
                  {/* Enable toggle */}
                  <button
                    type="button"
                    onClick={() => updateStep(step.id, "enabled", !step.enabled)}
                    className={`font-mono text-[9px] uppercase tracking-[0.1em] transition-colors ${step.enabled ? "text-[#34d399]" : "text-white/20"}`}
                  >
                    {step.enabled ? "on" : "off"}
                  </button>
                  {/* Remove */}
                  {workflow.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(step.id)}
                      className="text-white/20 hover:text-[#e84040] transition-colors"
                      aria-label="Remove step"
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                        <path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {/* Instruction */}
              <div className="px-4 pb-3">
                <textarea
                  rows={2}
                  value={step.instruction}
                  onChange={(e) => updateStep(step.id, "instruction", e.target.value)}
                  placeholder="Instruction for this step…"
                  className="w-full resize-none bg-transparent text-[13px] text-white/55 placeholder:text-white/20 outline-none"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add step + execute */}
      <div className="px-5 py-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addStep}
          className="flex items-center gap-1.5 rounded border border-white/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
            <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Add step
        </button>
        <button
          type="button"
          onClick={() => setShowSaved((v) => !v)}
          className="flex items-center gap-1.5 rounded border border-white/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
        >
          Saved ({savedWorkflows.length})
        </button>
        <button
          type="button"
          onClick={executeWorkflow}
          disabled={isExecuting || !prompt.trim()}
          className="cs-btn-deploy ml-auto px-6 py-2.5 text-[10px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isExecuting ? `Step ${currentStep}/${enabledCount}…` : "Run workflow →"}
        </button>
      </div>

      {/* Saved workflows panel */}
      {showSaved && (
        <div className="mx-5 mb-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="text"
              placeholder="Workflow name…"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="flex-1 rounded border border-white/10 bg-transparent px-3 py-1.5 font-mono text-[12px] text-white/70 placeholder:text-white/25 outline-none focus:border-[#e84040]/40"
            />
            <button
              type="button"
              onClick={saveWorkflow}
              className="rounded border border-white/20 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-white/60 transition-colors hover:text-white"
            >
              Save current
            </button>
          </div>
          {savedWorkflows.length === 0 ? (
            <p className="text-[13px] text-white/30">No saved workflows yet.</p>
          ) : (
            <ul className="space-y-2">
              {savedWorkflows.map((wf, i) => (
                <li key={i} className="flex items-center justify-between rounded border border-white/5 px-3 py-2">
                  <div>
                    <span className="text-[13px] text-white/70">{wf.name}</span>
                    <span className="ml-2 font-mono text-[10px] text-white/30">{wf.steps.length} steps</span>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => loadWorkflow(wf)} className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#e84040]/70 hover:text-[#e84040]">Load</button>
                    <button type="button" onClick={() => deleteWorkflow(i)} className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/20 hover:text-white/50">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-5 mb-4 flex items-start gap-2.5 rounded-xl border border-[#e84040]/30 bg-[#e84040]/[0.05] px-4 py-3 text-[13px] text-[#e84040]">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="mt-0.5 shrink-0" aria-hidden="true">
            <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M7.5 4v4M7.5 10v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="px-5 pb-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Results</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => exportResults("markdown")} className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/30 hover:text-white/60 transition-colors">Export .md</button>
              <button type="button" onClick={() => exportResults("json")} className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/30 hover:text-white/60 transition-colors">Export .json</button>
            </div>
          </div>
          {results.map((result) => {
            const cfg = PROVIDER_CONFIG[result.provider];
            return (
              <div key={result.stepId} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
                  <span className="font-mono text-[11px] font-semibold" style={{ color: cfg.color }}>
                    {cfg.name} · {result.model}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-white/25">{new Date(result.timestamp).toLocaleTimeString()}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(result.content, result.stepId)}
                      className="text-white/30 hover:text-white/70 transition-colors"
                      aria-label="Copy"
                    >
                      {copiedId === result.stepId ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 7l3.5 3.5L12 3" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M2 10V2h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                      )}
                    </button>
                  </div>
                </div>
                <pre className="px-4 py-3 text-[13px] leading-relaxed text-white/65 whitespace-pre-wrap font-sans overflow-x-auto max-h-64">{result.content}</pre>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <div className="border-t border-white/5 px-5 py-3">
        <p className="font-mono text-[10px] text-white/20">
          Calls go direct browser → provider. Keys stay in memory only — never sent to Conqueror Studios servers.
        </p>
      </div>
    </div>
  );
}
