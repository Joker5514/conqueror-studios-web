import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHead } from "@/components/site/Section";
import ProductHero from "@/components/site/ProductHero";
import FeatureGrid from "@/components/site/FeatureGrid";
import SplitFeature from "@/components/site/SplitFeature";
import ProductCTA from "@/components/site/ProductCTA";

export const metadata: Metadata = {
  title: "Agent Studio — Create, run, and host AI agents",
  description:
    "Build, deploy, and host AI agents on Conqueror Studios. From single-purpose bots to full multi-agent pipelines — define, run, and observe everything from one control plane.",
};

const RUNTIMES = [
  { label: "Python", color: "#3b82f6" },
  { label: "TypeScript", color: "#f59e0b" },
  { label: "LangGraph", color: "#8b5cf6" },
  { label: "MCP", color: "#e84040" },
  { label: "E2B Sandbox", color: "#34d399" },
  { label: "Docker", color: "#60a5fa" },
] as const;

export default function AgentsPage() {
  return (
    <>
      <ProductHero
        eyebrow="Agent Studio · Create · Run · Host"
        status="Early access"
        title={
          <>
            Your agents.{" "}
            <span className="text-white/50">Live in minutes.</span>
          </>
        }
        description="Define an agent in YAML or code, point it at your tools, and deploy. Conqueror Studios handles the runtime, memory, observability, and hosting — you stay in the logic."
        primaryCta={{ href: "/waitlist", label: "Request early access" }}
        secondaryCta={{
          href: "https://github.com/Joker5514/orchestrai-nexus",
          label: "Browse the engine",
          external: true,
        }}
        chips={["Python", "TypeScript", "LangGraph", "MCP", "E2B", "Docker"]}
      />

      {/* ── Quick-start strip ─────────────────────────────── */}
      <div className="border-b border-white/10 bg-[#0a0a10]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <span className="eyebrow shrink-0">Supported runtimes</span>
            <div className="flex flex-wrap gap-2">
              {RUNTIMES.map((r) => (
                <span
                  key={r.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-white/60"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: r.color }}
                  />
                  {r.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Three-step flow ───────────────────────────────── */}
      <Section className="py-20">
        <SectionHead
          eyebrow="How it works"
          title="Create, connect, deploy."
          description="Three steps from idea to running agent. No infra wrangling, no provider lock-in."
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:grid-cols-3">
          {(
            [
              {
                step: "01",
                title: "Define your agent",
                body: "Describe the agent's role, tools, and memory in a YAML manifest or drop in a Python / TypeScript class. The Studio validates the schema and surfaces missing dependencies before you ship.",
                accent: "#e84040",
              },
              {
                step: "02",
                title: "Connect tools & models",
                body: "Attach MCP servers, REST endpoints, databases, or code sandboxes. Pick any LLM — GPT, Claude, Gemini, local Llama, or a fine-tune. Swap models per-step without touching the agent logic.",
                accent: "#0066ff",
              },
              {
                step: "03",
                title: "Deploy and observe",
                body: "One command to host. Every run is traced — inputs, outputs, tool calls, retries, and token costs. Replay any run to reproduce bugs or create regression gates.",
                accent: "#34d399",
              },
            ] as const
          ).map(({ step, title, body, accent }) => (
            <div key={step} className="flex flex-col gap-4 bg-[#0a0a10] p-8">
              <span
                className="font-orbitron text-[28px] font-bold leading-none"
                style={{ color: accent, textShadow: `0 0 24px ${accent}55` }}
              >
                {step}
              </span>
              <h3 className="text-[17px] font-medium tracking-tight text-white">
                {title}
              </h3>
              <p className="text-[14px] leading-relaxed text-white/55">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Feature grid ─────────────────────────────────── */}
      <Section className="border-t border-white/10 py-20">
        <SectionHead
          eyebrow="Platform features"
          title="Everything an agent needs to run in production."
        />
        <div className="mt-10">
          <FeatureGrid
            features={[
              {
                title: "Visual agent builder",
                description:
                  "Drag-and-drop topology editor for multi-agent graphs. Wire specialists, routers, and memory nodes without writing orchestration boilerplate.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                    <rect x="11" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                    <rect x="6" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M4 7v2a2 2 0 002 2h1M14 7v2a2 2 0 01-2 2h-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Persistent memory",
                description:
                  "Episodic, semantic, and procedural memory layers shared across agents. Query, diff, and rollback memory state the same way you version code.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <ellipse cx="9" cy="5" rx="7" ry="3" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M2 5v4c0 1.657 3.134 3 7 3s7-1.343 7-3V5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M2 9v4c0 1.657 3.134 3 7 3s7-1.343 7-3V9" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                ),
              },
              {
                title: "Hot-swap models",
                description:
                  "Assign a different LLM to each step. Mix GPT-4o, Claude Opus, Gemini Flash, and local Llama in a single run. Change models without redeploying.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M3 9h12M11 5l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: "Sandboxed execution",
                description:
                  "Each agent run gets an E2B-backed code sandbox. Run Python, bash, or browser automation in full isolation with automatic teardown.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M6 8l2 2-2 2M10 12h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: "Full trace replay",
                description:
                  "Every span, tool call, token, and decision is journaled. Replay any run to reproduce failures, build evals, or prove correctness to stakeholders.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M7 6.5l5 2.5-5 2.5V6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: "MCP tool bus",
                description:
                  "Any MCP-compatible tool — databases, file systems, APIs, browsers — plugs in without custom adapters. The bus routes tool calls to the right server automatically.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M2 9h14M9 2v14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                ),
              },
            ]}
          />
        </div>
      </Section>

      {/* ── Split: single agent ───────────────────────────── */}
      <Section className="border-t border-white/10 py-20">
        <SplitFeature
          eyebrow="Single agents"
          title="One agent, one job, done right."
          bullets={[
            {
              title: "YAML or code",
              body: "Define the agent's system prompt, tools, and memory config in a single file.",
            },
            {
              title: "Trigger anywhere",
              body: "HTTP webhook, cron schedule, queue event, or a button in the UI — same agent, any entrypoint.",
            },
            {
              title: "Auto-scaling",
              body: "Zero instances when idle, instant scale-up on demand. Pay only for active compute.",
            },
            {
              title: "Secret management",
              body: "API keys injected at runtime via Vault-backed secret store. Never in source control.",
            },
          ]}
        >
          <p>
            Single-purpose agents are the easiest place to start. Pick a task —
            summarize inbound emails, monitor a Slack channel, run nightly
            research reports — define it once, and let the Studio handle the
            rest.
          </p>
        </SplitFeature>
      </Section>

      {/* ── Split: multi-agent ────────────────────────────── */}
      <Section className="border-t border-white/10 py-20">
        <SplitFeature
          reverse
          eyebrow="Multi-agent pipelines"
          title="Compose agents into production pipelines."
          bullets={[
            {
              title: "OrchestrAI Nexus engine",
              body: "Multi-agent graphs run on the same orchestration engine powering the flagship Nexus product.",
            },
            {
              title: "Cyclic state machines",
              body: "LangGraph-backed loops, branches, and human-in-the-loop checkpoints — all visual.",
            },
            {
              title: "Shared context graph",
              body: "Every agent in the pipeline reads and writes a common, versioned memory graph. No stale context.",
            },
            {
              title: "Per-step model routing",
              body: "Quantum-inspired router assigns the best model per step based on accuracy, cost, and latency targets.",
            },
          ]}
        >
          <p>
            Chain specialists: a researcher hands off to a writer who hands off
            to a reviewer. Each agent stays focused; the Nexus router handles
            context transfer, retries, and escalation when any step needs a
            human.
          </p>
        </SplitFeature>
      </Section>

      {/* ── Use-case grid ─────────────────────────────────── */}
      <Section className="border-t border-white/10 py-20">
        <SectionHead eyebrow="What people build" title="From experiments to production ops." />
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["Research assistant", "Decompose a brief into sub-questions, run parallel retrieval agents, synthesize a cited report."],
              ["Code review bot", "Triggered on PR open — checks style, security, and logic, then leaves line-level comments."],
              ["Customer triage", "Classifies incoming support tickets, routes to the right team, and drafts first-response suggestions."],
              ["Data pipeline", "Watches a source, transforms records through a chain of specialist agents, loads into the warehouse."],
              ["Nightly reporter", "Pulls metrics, generates a natural-language digest, and posts to Slack at 7 AM."],
              ["Voice counselor", "Multimodal agent that listens, reasons, and responds — wired to the AI Counselor product layer."],
            ] as [string, string][]
          ).map(([t, b]) => (
            <div key={t} className="bg-[#0a0a10] p-6">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="status-dot" />
                <span className="text-[15px] font-medium text-white">{t}</span>
              </div>
              <p className="text-[14px] leading-relaxed text-white/50">{b}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Hosting tiers table ───────────────────────────── */}
      <Section className="border-t border-white/10 py-20">
        <SectionHead
          eyebrow="Hosting"
          title="Managed, serverless, or on your infra."
          description="Every tier gets the same runtime — the difference is where it runs and who owns the compute bill."
        />
        <div className="mt-10 overflow-x-auto">
          <table className="w-full border-collapse font-mono text-[13px]">
            <thead>
              <tr className="border-b border-white/10">
                {["Tier", "Runtime", "Memory", "Concurrency", "Observability"].map((h) => (
                  <th key={h} className="py-3 pr-6 text-left font-medium uppercase tracking-[0.1em] text-white/40">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Sandbox", "Managed serverless", "Session-only", "1 concurrent", "Logs + replay"],
                  ["Studio", "Managed + persistent", "Persistent graph", "10 concurrent", "Full traces + evals"],
                  ["Nexus", "Bring your infra", "Unlimited", "Unlimited", "OTel export + custom sinks"],
                ] as [string, string, string, string, string][]
              ).map(([tier, runtime, mem, conc, obs], i) => (
                <tr key={tier} className={`border-b border-white/5 ${i === 1 ? "bg-white/[0.025]" : ""}`}>
                  <td className="py-3.5 pr-6 font-semibold text-white">{tier}</td>
                  <td className="py-3.5 pr-6 text-white/55">{runtime}</td>
                  <td className="py-3.5 pr-6 text-white/55">{mem}</td>
                  <td className="py-3.5 pr-6 text-white/55">{conc}</td>
                  <td className="py-3.5 pr-6 text-white/55">{obs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[13px] text-white/35">
          Pricing launches with early access.{" "}
          <Link href="/waitlist" className="text-[#e84040] hover:underline">
            Join the waitlist
          </Link>{" "}
          to lock in founder rates.
        </p>
      </Section>

      <ProductCTA
        eyebrow="Agent Studio"
        title="Build the agents you've been describing."
        description="Early access is open to teams with a concrete use case. Tell us what you're building and we'll get you running."
        primaryCta={{ href: "/waitlist", label: "Apply for early access" }}
        secondaryCta={{
          href: "/orchestrai",
          label: "See the orchestration engine",
        }}
      />
    </>
  );
}
