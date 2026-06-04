/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import { Section, SectionHead } from "@/components/site/Section";
import ProductHero from "@/components/site/ProductHero";
import FeatureGrid from "@/components/site/FeatureGrid";
import SplitFeature from "@/components/site/SplitFeature";
import ProductCTA from "@/components/site/ProductCTA";

export const metadata: Metadata = {
  title: "AI Bridge — Federated agent fabric",
  description:
    "AI Bridge unifies fragmented AI tools into a single observable, self-correcting ecosystem. The USB-C for AI tools, powered by MCP.",
};

export default function AiBridgePage() {
  return (
    <>
      <ProductHero
        eyebrow="Flagship · GTM wedge"
        status="Core build"
        title={
          <>
            The federated future of <span className="text-white/55">agentic workflows.</span>
          </>
        }
        description="Today's AI landscape is broken: developers juggle dozens of disconnected tools, automation breaks at integration boundaries, and there's no unified observability. AI Bridge is the integration fabric — the USB-C for AI tools, powered by MCP."
        primaryCta={{ href: "https://github.com/Joker5514/Ai-bridge", label: "View on GitHub", external: true }}
        secondaryCta={{ href: "/waitlist", label: "Request pilot access" }}
        image={{ src: "/assets/ai_bridge_overview.png", alt: "AI Bridge architecture overview" }}
        chips={["Next.js 15", "LangGraph", "MCP", "E2B Sandboxes", "OAuth"]}
      />

      <Section className="py-20">
        <SectionHead
          eyebrow="The problem"
          title="The fragmentation tax"
          description="The AI stack is a maze: dozens of LLM APIs and SDKs, hundreds of integration tools that don't speak the same language, and no unified way to see what your agents are actually doing in production."
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="panel-strong overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/fragmentation_problem.png" alt="AI fragmentation problem" className="w-full" />
          </div>
          <ul className="space-y-4 text-[15px] text-white/65">
            {[
              ["Dozens of LLMs", "OpenAI, Anthropic, Gemini, Llama, Mistral — each with its own SDK, idioms, and pricing."],
              ["Hundreds of tools", "Slack, GitHub, Figma, Stripe, Salesforce — every integration is a new fragile glue layer."],
              ["No unified observability", "Trace failures across providers, tools, and sandboxes is currently impossible."],
              ["Brittle automation", "When one tool changes its API, the entire workflow silently breaks."],
            ].map(([t, b]) => (
              <li key={t} className="border-l border-[#ff3355]/40 pl-4">
                <span className="text-white">{t}</span>
                <span className="ml-2 text-white/55">— {b}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section className="border-t border-white/10 py-20">
        <SectionHead
          eyebrow="The solution"
          title="One bus. Every agent. Every tool."
          description="AI Bridge becomes the universal integration layer for agentic workflows: standardized via MCP, observable end-to-end, and self-correcting when upstream APIs drift."
        />
        <div className="mt-10">
          <FeatureGrid
            features={[
              { title: "MCP-native", description: "Speak the Model Context Protocol fluently. Tools register themselves and expose typed capabilities to every agent on the bus." },
              { title: "Unified observability", description: "Every call, retry, fallback, and tool result is traced across providers and sandboxes in one timeline." },
              { title: "Self-correcting", description: "When upstream APIs drift, AI Bridge re-derives schemas, repairs prompts, and replays affected workflows automatically." },
              { title: "Provider-agnostic", description: "Swap GPT-4 for Claude or Gemini per-step without rewriting your graph. Cost and latency policies route automatically." },
              { title: "Sandboxed by default", description: "E2B sandboxes isolate every tool call. No more rogue agents touching production." },
              { title: "Git-native config", description: "Tool registries, routing policies, and agent graphs are versioned code. Reviewable, diffable, revertable." },
            ]}
          />
        </div>
      </Section>

      <Section className="border-t border-white/10 py-20">
        <SplitFeature
          eyebrow="GTM wedge"
          title="Why AI Bridge is the wedge"
          bullets={[
            { title: "Painful today", body: "Every serious team is stitching together brittle integration code right now." },
            { title: "Wide blast radius", body: "MCP-native means we plug into every existing agent framework, not against them." },
            { title: "Compounding moat", body: "The more tools and agents on the bus, the more valuable observability becomes." },
            { title: "Path to platform", body: "Once teams trust the bus, OrchestrAI Nexus is the natural orchestration layer on top." },
          ]}
        >
          <p>
            AI Bridge isn't a competitor to LangChain, LangGraph, or your agent
            framework of choice — it's the layer underneath them. Bring your
            stack; we make it observable, swappable, and resilient.
          </p>
        </SplitFeature>
      </Section>

      <ProductCTA
        eyebrow="Early access"
        title="Pilot AI Bridge with your team."
        description="We're onboarding a small number of design partners. If you're tired of brittle integration code, let's talk."
        primaryCta={{ href: "/waitlist", label: "Request pilot access" }}
        secondaryCta={{ href: "https://github.com/Joker5514/Ai-bridge", label: "Browse the code", external: true }}
      />
    </>
  );
}
