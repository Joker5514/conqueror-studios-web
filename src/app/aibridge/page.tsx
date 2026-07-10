/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import { Section, SectionHead } from "@/components/site/Section";
import ProductHero from "@/components/site/ProductHero";
import FeatureGrid from "@/components/site/FeatureGrid";
import SplitFeature from "@/components/site/SplitFeature";
import ProductCTA from "@/components/site/ProductCTA";
import MultiAIPlatform from "@/components/MultiAIPlatform";

export const metadata: Metadata = {
  title: "AI Bridge — Multi-provider AI orchestration platform",
  description:
    "AI Bridge v2 unifies Perplexity, Claude, OpenAI, Grok, Groq, and Abacus into a single observable orchestration platform. Sequential and parallel workflows, AES-256 key management, full cost tracking.",
};

const PROVIDERS = [
  { name: "Perplexity", models: "sonar-pro · sonar · sonar-reasoning-pro", color: "#1D9BF0" },
  { name: "Claude", models: "claude-opus-4 · claude-haiku", color: "#D97706" },
  { name: "OpenAI", models: "gpt-4o · gpt-5 · gpt-4o-mini", color: "#10A37F" },
  { name: "Grok", models: "grok-2 · grok-1.5", color: "#1DA1F2" },
  { name: "Groq", models: "llama3-70b-8192", color: "#F43F5E" },
  { name: "Abacus AI", models: "research-assistant · code-developer · data-analyst", color: "#8B5CF6" },
] as const;

export default function AiBridgePage() {
  return (
    <>
      <ProductHero
        eyebrow="Core build · Multi-provider orchestration"
        status="v2.1.0 — active development"
        title={
          <>
            One interface.{" "}
            <span className="text-white/50">Every AI provider.</span>
          </>
        }
        description="AI Bridge v2 is a production-ready orchestration platform that chains Perplexity, Claude, OpenAI, Grok, Groq, and Abacus into sequential or parallel workflows — with AES-256 API key encryption, full conversation persistence, and per-model cost tracking built in."
        primaryCta={{ href: "https://github.com/Joker5514/ai-bridge-v2", label: "View on GitHub", external: true }}
        secondaryCta={{ href: "/waitlist", label: "Request pilot access" }}
        image={{ src: "/assets/ai_bridge_overview.png", alt: "AI Bridge multi-provider orchestration UI" }}
        chips={["Python", "FastAPI", "React", "LangChain", "SQLAlchemy", "AES-256"]}
      />

      {/* ── Provider strip ──────────────────────────────────── */}
      <div className="border-b border-white/10 bg-[#0a0a10]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <span className="eyebrow shrink-0">Supported providers</span>
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((p) => (
                <span
                  key={p.name}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] tracking-[0.08em] text-white/60"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Live demo ──────────────────────────────────────── */}
      <Section className="py-20">
        <SectionHead
          eyebrow="Try it live"
          title="Chain any provider. Run it now."
          description="Add your API keys in the settings panel, build a workflow, and execute — calls go direct from your browser to each provider."
        />
        <div className="mt-10">
          <MultiAIPlatform />
        </div>
      </Section>

      {/* ── The problem ────────────────────────────────────── */}
      <Section className="py-20">
        <SectionHead
          eyebrow="The problem"
          title="The multi-provider tax"
          description="Every serious AI team ends up writing the same boilerplate: provider-specific clients, brittle retry logic, manual cost tracking, and no way to chain models without glue code that breaks at every API update."
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-start">
          <ul className="space-y-4 text-[15px]">
            {[
              ["Provider-specific SDKs", "Anthropic, OpenAI, Perplexity, and xAI all have different auth headers, message formats, and error shapes."],
              ["No workflow chaining", "Running a Perplexity research step followed by a Claude spec step followed by a GPT roadmap review requires custom orchestration code every time."],
              ["Secrets sprawl", "API keys in environment files, hardcoded strings, and .env leaks — no central encrypted store."],
              ["Zero cost visibility", "Token counts and dollar costs are buried in provider dashboards with no cross-provider aggregation."],
            ].map(([t, b]) => (
              <li key={t} className="border-l border-[#e84040]/40 pl-4">
                <span className="text-[15px] font-medium text-white">{t}</span>
                <p className="mt-0.5 text-[14px] leading-relaxed text-white/55">{b}</p>
              </li>
            ))}
          </ul>
          <div className="panel-strong overflow-hidden rounded-2xl">
            <img src="/assets/ai_bridge_overview.png" alt="AI Bridge architecture" className="w-full" />
          </div>
        </div>
      </Section>

      {/* ── Features ───────────────────────────────────────── */}
      <Section className="border-t border-white/10 py-20">
        <SectionHead
          eyebrow="Platform features"
          title="What AI Bridge ships with."
          description="Every capability grounded in the v2.1.0 codebase — not a roadmap."
        />
        <div className="mt-10">
          <FeatureGrid
            features={[
              {
                title: "LangChain unified wrapper",
                description: "A single LangChainWrapper class normalises ChatAnthropic, ChatOpenAI, and ChatGroq behind one .complete(model, messages) interface — swap providers without touching workflow logic.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M3 9h12M9 3l6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: "AES-256 key management",
                description: "API keys are stored Fernet-encrypted in Postgres. Keys are decrypted per-request in memory and never written to logs or responses.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <rect x="3" y="8" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M6 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Sequential & parallel execution",
                description: "Chain providers in order — Perplexity researches, Claude specs, GPT reviews — or fan out to all providers simultaneously and aggregate. Configurable per workflow.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <circle cx="4" cy="9" r="2" stroke="currentColor" strokeWidth="1.4" />
                    <circle cx="14" cy="5" r="2" stroke="currentColor" strokeWidth="1.4" />
                    <circle cx="14" cy="13" r="2" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M6 9h4M10 9l-.5-3M10 9l-.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Real-time cost tracking",
                description: "Per-provider, per-model cost rates (2025 pricing) are calculated on every call. The analytics service aggregates token counts and dollar spend by provider, model, and date range.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M3 14l4-5 3 3 4-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: "Conversation persistence",
                description: "Full chat history stored via SQLAlchemy async ORM. Every message — role, content, token counts, cost — is persisted with conversation grouping for replay and audit.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M3 4h12v8H3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                    <path d="M6 14h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "Retry with backoff",
                description: "Configurable retry attempts with exponential backoff on provider errors. Failed calls are retried transparently — the workflow never surfaces a transient 429 or 5xx.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M3 9a6 6 0 1110.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M13 2v3h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
            ]}
          />
        </div>
      </Section>

      {/* ── Workflow split ─────────────────────────────────── */}
      <Section className="border-t border-white/10 py-20">
        <SplitFeature
          eyebrow="Frontend — MultiAIPlatform"
          title="Build workflows in the UI, not config files."
          bullets={[
            { title: "Step builder", body: "Add providers, pick models, write per-step instructions, toggle whether the step feeds on the previous output." },
            { title: "Execution modes", body: "Switch between sequential (chain outputs) and parallel (fan-out to all providers) per run." },
            { title: "Workflow persistence", body: "Named workflows save to localStorage and reload across sessions — no backend required for the UI." },
            { title: "Export results", body: "Download the full run as Markdown or JSON with one click." },
          ]}
        >
          <p>
            The React <code>MultiAIPlatform</code> component makes direct
            browser-to-provider API calls with your own keys — no server round-trip
            for the UI layer. The FastAPI backend handles persistence, analytics, and
            encrypted key storage when you need the full stack.
          </p>
        </SplitFeature>
      </Section>

      {/* ── Backend split ──────────────────────────────────── */}
      <Section className="border-t border-white/10 py-20">
        <SplitFeature
          reverse
          eyebrow="Backend — FastAPI + SQLAlchemy"
          title="Production backend out of the box."
          bullets={[
            { title: "Client factory", body: "get_client() resolves the right provider client from the encrypted key store in one call." },
            { title: "Async ORM", body: "SQLAlchemy async with PgBouncer transaction pooling — no blocking DB calls in the request path." },
            { title: "Usage analytics", body: "The analytics service groups token and cost data by provider, model, and date — queryable via a single endpoint." },
            { title: "Microservices-ready", body: "Auth, workflow engine, provider bridge, analytics, and webhook delivery are designed as separable services." },
          ]}
        >
          <p>
            The backend is structured around a clean services pattern: each concern
            (conversation persistence, analytics, provider routing) lives in its own
            module with no cross-cutting imports. Swap Postgres for another async
            SQLAlchemy target without touching business logic.
          </p>
        </SplitFeature>
      </Section>

      {/* ── Provider model table ───────────────────────────── */}
      <Section className="border-t border-white/10 py-20">
        <SectionHead
          eyebrow="Provider matrix"
          title="Every model. Every integration type."
          description="Pricing sourced from live 2025 API rates, baked into the cost calculator."
        />
        <div className="mt-10 overflow-x-auto">
          <table className="w-full border-collapse font-mono text-[13px]">
            <thead>
              <tr className="border-b border-white/10">
                {["Provider", "Models", "Integration", "Input $/M", "Output $/M"].map((h) => (
                  <th key={h} className="py-3 pr-6 text-left font-medium uppercase tracking-[0.1em] text-white/40">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Perplexity", "sonar-pro, sonar, sonar-reasoning-pro", "Direct + LangChain", "$2.50–5.00", "$10.00–20.00"],
                  ["Claude", "claude-opus-4, claude-haiku", "LangChain (ChatAnthropic)", "$0.25–15.00", "$1.25–75.00"],
                  ["OpenAI", "gpt-4o, gpt-5, gpt-4o-mini", "Direct + LangChain", "$0.15–5.00", "$0.60–15.00"],
                  ["Grok", "grok-2, grok-1.5", "OpenAI-compat (xAI base URL)", "$3.00–5.00", "$10.00–15.00"],
                  ["Groq", "llama3-70b-8192", "LangChain (ChatGroq)", "$0.05", "$0.10"],
                  ["Abacus AI", "research, code, data-analyst", "Direct API", "$3.00", "$10.00"],
                ] as [string, string, string, string, string][]
              ).map(([provider, models, integration, inp, out]) => (
                <tr key={provider} className="border-b border-white/5">
                  <td className="py-3.5 pr-6 font-semibold text-white">{provider}</td>
                  <td className="py-3.5 pr-6 text-white/55">{models}</td>
                  <td className="py-3.5 pr-6 text-white/55">{integration}</td>
                  <td className="py-3.5 pr-6 text-white/55">{inp}</td>
                  <td className="py-3.5 pr-6 text-white/55">{out}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Roadmap ────────────────────────────────────────── */}
      <Section className="border-t border-white/10 py-20">
        <SectionHead eyebrow="Roadmap" title="What's next for AI Bridge." />
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:grid-cols-3">
          {(
            [
              ["Immediate — 4 weeks", "#34d399", ["DB query optimisation + Redis caching", "MFA (TOTP + WebAuthn)", "OpenTelemetry + Prometheus monitoring", "Rate limiting per user + provider"]],
              ["Short-term — 8 weeks", "#0066ff", ["Full microservices split", "Event streaming (Kafka/Redis Streams)", "80%+ test coverage", "CI/CD pipeline with E2E gating"]],
              ["Long-term — 12 weeks", "#e84040", ["Kubernetes + Helm + Istio mesh", "Multi-region GeoDNS failover", "Advanced AI orchestration (MCP/A2A)", "Agent marketplace integrations"]],
            ] as [string, string, string[]][]
          ).map(([phase, color, items]) => (
            <div key={phase} className="flex flex-col gap-4 bg-[#0a0a10] p-6">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color }}>{phase}</span>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[14px] text-white/60">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/25" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <ProductCTA
        eyebrow="AI Bridge v2"
        title="Stop writing provider glue. Start shipping workflows."
        description="We're onboarding design partners who need multi-provider orchestration in production. Bring your use case."
        primaryCta={{ href: "/waitlist", label: "Request pilot access" }}
        secondaryCta={{ href: "https://github.com/Joker5514/ai-bridge-v2", label: "Browse the code", external: true }}
      />
    </>
  );
}
