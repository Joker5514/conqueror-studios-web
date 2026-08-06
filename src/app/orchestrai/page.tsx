import type { Metadata } from "next";
import { Section, SectionHead } from "@/components/site/Section";
import ProductHero from "@/components/site/ProductHero";
import FeatureGrid from "@/components/site/FeatureGrid";
import SplitFeature from "@/components/site/SplitFeature";
import ProductCTA from "@/components/site/ProductCTA";

export const metadata: Metadata = {
  title: "OrchestrAI Nexus — Multi-agent orchestration platform",
  description:
    "OrchestrAI Nexus: FastAPI WebSocket backbone, STT→LLM→TTS voice loop, NVIDIA NIM coding agent (Planner→Coder→Executor→Debugger), LangGraph-style orchestration, and GraphRAG memory.",
};

export default function OrchestraiPage() {
  return (
    <>
      <ProductHero
        eyebrow="Flagship · Orchestration engine"
        status="Phase 7 — active development"
        title={
          <>
            The conductor of your{" "}
            <span className="text-white/50">AI orchestra.</span>
          </>
        }
        description="OrchestrAI Nexus is a multi-agent orchestration framework built on a FastAPI WebSocket spine. It ships a real-time STT→LLM→TTS voice loop, a NVIDIA NIM-powered coding agent (Planner→Coder→Executor→Debugger ReAct loop), LangGraph-style orchestration graphs, and a Letta-inspired GraphRAG memory stack."
        primaryCta={{ href: "https://github.com/Joker5514/orchestrai-nexus", label: "View on GitHub", external: true }}
        secondaryCta={{ href: "/waitlist", label: "Get early access" }}
        image={{ src: "/assets/orchestrai_hero.png", alt: "OrchestrAI Nexus hero" }}
        chips={["Python", "FastAPI", "LangGraph", "NVIDIA NIM", "GraphRAG", "WebSocket", "ElevenLabs"]}
      />

      {/* ── What's actually implemented ───────────────────── */}
      <Section className="py-20">
        <SectionHead
          eyebrow="Implemented — not roadmap"
          title="What's running in the repo today."
          description="Nexus is in active prototyping. These are the modules with real, running code as of the current build."
        />
        <div className="mt-10">
          <FeatureGrid
            features={[
              {
                title: "FastAPI WebSocket spine",
                description: "Real-time bidirectional communication layer. Auth, users, conversations, and AI routes are all wired in via FastAPI routers with Redis-backed session state.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M2 9h14M9 2v14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                ),
              },
              {
                title: "STT → LLM → TTS voice loop",
                description: "Whisper handles speech-to-text, any configured LLM processes the intent, ElevenLabs synthesises the response. The full pipeline is wired over the WebSocket spine with async cleanup on shutdown.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <rect x="7" y="2" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M4 9a5 5 0 0010 0M9 14v2M6 16h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                title: "NVIDIA NIM coding agent",
                description: "A full ReAct loop: Planner decomposes tasks into EditSpecs, Coder generates unified diffs using NIM coding models, Executor applies patches and runs tests, Debugger diagnoses failures and re-plans.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M4 14l2-4 3 2 2-5 3 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                title: "LangGraph-style orchestration",
                description: "Declarative YAML workflow spec compiler generates running agent graphs. Three built-in patterns: Planner–Executor–Critic, Supervisor–Worker Pool, and Governance–Action Dichotomy.",
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
                title: "GraphRAG + long-term memory",
                description: "Letta-inspired memory management with episodic, semantic, and procedural layers. Context is compressed, relevance-scored, and retrieved via vector similarity — not truncated.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <ellipse cx="9" cy="5" rx="7" ry="3" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M2 5v4c0 1.657 3.134 3 7 3s7-1.343 7-3V5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M2 9v4c0 1.657 3.134 3 7 3s7-1.343 7-3V9" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                ),
              },
              {
                title: "Ethical governance module",
                description: "GovernanceAgent, SafetyAgent, and AuditAgent run as standard workflow nodes. Autonomy modes (AUTO / ASSIST / RECOMMEND_ONLY) are configurable per tenant, workflow, and action type.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M9 2l7 3v4c0 4-3 6.5-7 8C5 15.5 2 13 2 9V5l7-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                    <path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
            ]}
          />
        </div>
      </Section>

      {/* ── NVIDIA coding agent ───────────────────────────── */}
      <Section className="border-t border-white/10 py-20">
        <SplitFeature
          eyebrow="NVIDIA NIM coding agent"
          title="A ReAct loop that writes, tests, and debugs code."
          bullets={[
            { title: "Planner", body: "nvidia/llama-3.3-70b-instruct decomposes the task into EditSpecs — file path, change description, context hint, test expectations." },
            { title: "Coder", body: "nvidia/llama-3.1-nemotron-ultra-253b-v1 generates a unified diff or full file blob per EditSpec." },
            { title: "Executor", body: "Applies patches, runs the test command, runs the linter. Returns pass/fail + stdout/stderr." },
            { title: "Debugger", body: "On failure, the reasoning model diagnoses the diff, updates the EditSpec list, and loops back to Coder. Aborts cleanly at max_iterations." },
          ]}
        >
          <p>
            The agent exposes three HTTP endpoints —{" "}
            <code>POST /implement_feature</code>,{" "}
            <code>/apply_change</code>, and <code>/refactor_repo</code> — each
            mapped to a named entrypoint in the ReAct loop. Safety controls cap
            iterations at 5 and file scope at 20 files per plan.
          </p>
        </SplitFeature>
      </Section>

      {/* ── Architecture ──────────────────────────────────── */}
      <Section className="border-t border-white/10 py-20">
        <SplitFeature
          reverse
          eyebrow="System architecture"
          title="Five layers, one coherent system."
          image={{ src: "/assets/nexus_dashboard.png", alt: "Nexus operator dashboard" }}
          bullets={[
            { title: "Interface layer", body: "React + Three.js frontend, WebSocket client, voice-first avatar shell." },
            { title: "Consciousness layer", body: "Ethical engine, awareness metrics, and decision-tree governance run before any action executes." },
            { title: "Orchestration core", body: "Workflow engine, agent coordinator, and context manager. Cyclic LangGraph-style graphs with parallel, sequential, and map/reduce nodes." },
            { title: "AI provider layer", body: "OpenAI, Anthropic, Google, Hugging Face, local Ollama — with per-step model routing based on latency, cost, and capability." },
            { title: "Data persistence", body: "Supabase + Postgres, Pinecone/Weaviate vector DB, Redis cache, blockchain audit trail for immutable decision logs." },
          ]}
        >
          <p>
            Nexus runs on top of AI Bridge for tooling and observability. The two
            products share the same MCP tool bus — agents in Nexus consume tools
            registered through AI Bridge, and every call is traced end-to-end.
          </p>
        </SplitFeature>
      </Section>

      {/* ── Orchestration patterns ────────────────────────── */}
      <Section className="border-t border-white/10 py-20">
        <SectionHead
          eyebrow="Orchestration patterns"
          title="First-class workflow topologies."
          description="Common multi-agent coordination patterns are built-in templates, not custom prompt spaghetti."
        />
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] md:grid-cols-3">
          {(
            [
              [
                "Planner–Executor–Critic",
                "Decompose → execute (parallel or sequential) → quality gate. Loops back to planner on failure. Used in the NVIDIA coding agent and voice survey pipeline.",
              ],
              [
                "Supervisor–Worker Pool",
                "Supervisor distributes tasks to N workers, aggregates results. Suited for bulk batch operations: survey analysis, content generation at scale, parallel research.",
              ],
              [
                "Governance–Action",
                "ActionAgent proposes + rationale. GovernanceAgent validates against policy rules. Escalates to human on RECOMMEND_ONLY. Used for high-impact decisions.",
              ],
            ] as [string, string][]
          ).map(([t, b]) => (
            <div key={t} className="bg-[#0a0a10] p-6">
              <div className="text-[15px] font-medium text-white">{t}</div>
              <div className="mt-2 text-[14px] leading-relaxed text-white/55">{b}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── MCP + A2A ─────────────────────────────────────── */}
      <Section className="border-t border-white/10 py-20">
        <SectionHead
          eyebrow="Protocol-native connectivity"
          title="MCP tool registry + A2A interop."
          description="Nexus is built as an 'agent internet router' — external tools and other agent ecosystems plug in with minimal glue."
        />
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:grid-cols-2">
          {(
            [
              ["MCP Tool Registry", "Tools register with a standard {name, description, schema, auth} definition. A ToolCallAdapter wraps REST, gRPC, DB, file, and sensor calls behind a unified interface. Any MCP-compatible tool plugs in without a custom adapter."],
              ["A2A Interop", "Internal agent messages are aligned with the Google Agent-to-Agent spec. External agent endpoints connect via adapters. Nexus agents can be published as MCP tools for external consumption."],
              ["Edge runtime matrix", "Same logical agent deploys to cloud (Node.js/Python), edge-mobile (Kotlin/Swift), edge-browser (WebAssembly/WebGPU), or edge-device (Termux) based on latency budget and capability requirements."],
              ["AI Economics (Phase 7)", "Inter-AI marketplace: agents trade knowledge, skills, and services on behalf of users. On-chain identity, reputation, metering, and settlement primitives are in active development."],
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

      {/* ── Roadmap ───────────────────────────────────────── */}
      <Section className="border-t border-white/10 py-20">
        <SectionHead eyebrow="Phases 1–8" title="Where Nexus has been and where it's going." />
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Phases 1–6 · Done", "#34d399", ["WebSocket spine + real-time comms", "STT→LLM→TTS baseline loop", "Multi-agent orchestration scaffold", "Smart home adapter integrations", "Ethical governance module", "GraphRAG memory foundation"]],
              ["Phase 7 · Active", "#e84040", ["AI economics + inter-AI marketplace", "On-chain identity, reputation, settlement", "MCP integration for inter-agent comms", "Neuromorphic sentinel agents", "Continuous consciousness loops"]],
              ["Phase 8 · 2027", "#0066ff", ["Sentinel agents — always-on awareness", "Dream/reflection offline consolidation", "Quantum-inspired routing at scale", "Moshi-grade voice — sub-100ms latency"]],
              ["Voice App Pack", "#8b5cf6", ["DenoiseAgent (VoiceIsolate DSP core)", "TranscriptionAgent (edge/cloud hybrid)", "IntentAgent (on-device classifier)", "VoiceSessionState schema + sync protocol", "Voice micro-survey workflow recipe"]],
            ] as [string, string, string[]][]
          ).map(([phase, color, items]) => (
            <div key={phase} className="flex flex-col gap-3 bg-[#0a0a10] p-6">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color }}>{phase}</span>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[13px] text-white/55">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/20" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <ProductCTA
        title="Want orchestration that doesn't drift?"
        description="OrchestrAI Nexus is in active development with design partners. Tell us what you're building and we'll get you into the program."
        primaryCta={{ href: "/waitlist", label: "Apply for early access" }}
        secondaryCta={{ href: "https://github.com/Joker5514/orchestrai-nexus", label: "Browse the code", external: true }}
      />
    </>
  );
}
