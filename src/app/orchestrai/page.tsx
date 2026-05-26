/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import { Section, SectionHead } from "@/components/site/Section";
import ProductHero from "@/components/site/ProductHero";
import FeatureGrid from "@/components/site/FeatureGrid";
import SplitFeature from "@/components/site/SplitFeature";
import ProductCTA from "@/components/site/ProductCTA";

export const metadata: Metadata = {
  title: "OrchestrAI Nexus — Multi-agent orchestration",
  description:
    "The conductor of your AI orchestra. OrchestrAI Nexus coordinates specialized agents with intelligent routing, unified memory, and seamless execution.",
};

export default function OrchestraiPage() {
  return (
    <>
      <ProductHero
        eyebrow="Flagship · Orchestration brain"
        status="Active development"
        title={
          <>
            The conductor of your <span className="text-white/55">AI orchestra.</span>
          </>
        }
        description="OrchestrAI Nexus coordinates a federated mesh of specialized agents: intelligent routing, unified memory, deterministic replay, and end-to-end observability. Built for teams who treat agent workflows like production software."
        primaryCta={{ href: "https://github.com/Joker5514/orchestrai-nexus", label: "View on GitHub", external: true }}
        secondaryCta={{ href: "/waitlist", label: "Get early access" }}
        image={{ src: "/assets/orchestrai_hero.png", alt: "OrchestrAI Nexus hero" }}
        chips={["Python", "LangGraph", "Quantum-inspired routing", "Ethical governance"]}
      />

      <Section className="py-20">
        <SectionHead
          eyebrow="What it does"
          title="Specialized agents, one coherent system."
          description="Instead of one mega-agent that tries to do everything, OrchestrAI Nexus runs a federation of focused agents and orchestrates the handoffs between them."
        />
        <div className="mt-10">
          <FeatureGrid
            features={[
              { title: "Intelligent routing", description: "Quantum-inspired router picks the right agent and provider per step based on accuracy, latency, and cost." },
              { title: "Unified memory", description: "Shared, vectorized context graph across agents — every agent sees the relevant history, none of the noise." },
              { title: "Deterministic replay", description: "Every run can be replayed bit-for-bit. Bugs become unit tests. Evals become regression gates." },
              { title: "Ethical governance", description: "Policy layer for content boundaries, escalation paths, and data residency — enforced before execution." },
              { title: "Hot-swappable models", description: "Per-step model selection. Mix GPT, Claude, Gemini, local Llama, and fine-tunes in one graph." },
              { title: "Observable by default", description: "Every span, tool call, retry, and decision is traced. Slack-, OpenTelemetry-, and Postgres-friendly." },
            ]}
          />
        </div>
      </Section>

      <Section className="border-t border-white/10 py-20">
        <SplitFeature
          eyebrow="Architecture"
          title="A federated mesh, not a monolith."
          image={{ src: "/assets/nexus_dashboard.png", alt: "Nexus operator dashboard" }}
          bullets={[
            { title: "Bus", body: "Tools and agents communicate over the AI Bridge MCP bus." },
            { title: "Router", body: "The Nexus router decomposes tasks, picks specialists, and assembles results." },
            { title: "Memory", body: "Episodic, semantic, and procedural memory layers, all queryable and diffable." },
            { title: "Replay", body: "Every step is journaled. Replay produces identical decisions for audit and regression." },
          ]}
        >
          <p>
            Nexus runs on top of AI Bridge for tooling and observability. That
            means you get a single pane of glass over your whole agent stack —
            no more stitching dashboards together across providers and SDKs.
          </p>
        </SplitFeature>
      </Section>

      <Section className="border-t border-white/10 py-20">
        <SectionHead
          eyebrow="Use cases"
          title="Where Nexus earns its keep"
        />
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] md:grid-cols-2">
          {[
            ["Customer operations", "Triage, research, and resolve tickets across product, billing, and policy with full audit trails."],
            ["Research workflows", "Decompose long, multi-step research tasks across specialized retrieval and reasoning agents."],
            ["Sales engineering", "Discovery, scoping, and demo prep agents that hand off cleanly to humans with context preserved."],
            ["Internal ops", "Replace brittle Zapier chains with reviewable, replayable agent graphs that don't silently break."],
          ].map(([t, b]) => (
            <div key={t} className="bg-[#0a0a10] p-6">
              <div className="text-[15px] font-medium text-white">{t}</div>
              <div className="mt-2 text-[14px] leading-relaxed text-white/55">{b}</div>
            </div>
          ))}
        </div>
      </Section>

      <ProductCTA
        title="Want orchestration that doesn't drift?"
        description="OrchestrAI Nexus is in active development with design partners. Tell us what you're building."
        primaryCta={{ href: "/waitlist", label: "Apply for early access" }}
        secondaryCta={{ href: "https://github.com/Joker5514/orchestrai-nexus", label: "Browse the code", external: true }}
      />
    </>
  );
}
