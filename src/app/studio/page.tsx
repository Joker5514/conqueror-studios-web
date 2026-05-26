/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import { Section, SectionHead } from "@/components/site/Section";
import ProductCTA from "@/components/site/ProductCTA";

export const metadata: Metadata = {
  title: "Studio — How we work",
  description:
    "Conqueror Studios is an independent AI R&D lab in Mobile, Alabama. Here's how we work and what we build.",
};

const principles = [
  { title: "Determinism over magic", body: "We optimize for replay, not vibes. If you can't reproduce it, you can't ship it." },
  { title: "Git-native everything", body: "Configs, prompts, evals, and policy live in repos. Reviewable, diffable, revertable." },
  { title: "Federated by default", body: "Specialized agents on a shared bus beat one mega-agent on every metric we care about." },
  { title: "Voice as a surface", body: "Latency, prosody, and barge-in are product decisions — not afterthoughts." },
  { title: "Built in the open", body: "Most of the lab is public on GitHub. Transparency is a feature, not a marketing slogan." },
  { title: "Safety as engineering", body: "Crisis paths, escalation triggers, and guardrails are part of the spec — not the patch list." },
];

export default function StudioPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="grid-bg absolute inset-0 -z-10" />
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-20">
          <span className="eyebrow">The studio</span>
          <h1 className="mt-4 text-balance text-5xl font-medium tracking-tight sm:text-6xl lg:text-[72px] lg:leading-[1.02]">
            An independent AI R&amp;D lab.
          </h1>
          <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-white/65">
            Conqueror Studios is based in Mobile, Alabama. We build agentic
            systems we'd be willing to put our own name on — instrumented from
            day one, Git-native by default, and federated by design.
          </p>
        </div>
      </section>

      <Section className="py-20">
        <SectionHead eyebrow="Operating principles" title="How we work" />
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:grid-cols-2 lg:grid-cols-3">
          {principles.map((p) => (
            <div key={p.title} className="bg-[#0a0a10] p-6">
              <div className="text-[15px] font-medium text-white">{p.title}</div>
              <div className="mt-2 text-[14px] leading-relaxed text-white/55">{p.body}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t border-white/10 py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <SectionHead
            eyebrow="Founder"
            title="Randy Jordan."
            description="Engineer, researcher, and the lab's lead. Background spans systems software, audio DSP, and applied ML. Builds in the open."
          />
          <div className="panel p-6 text-[14px] leading-relaxed text-white/65">
            <p>
              I started Conqueror Studios because the agentic stack felt
              brittle, opaque, and over-marketed. Every system I admired in
              software — version control, distributed tracing, deterministic
              builds — was missing from the AI tooling I was using day to day.
            </p>
            <p className="mt-4">
              So the lab's job is to put those primitives back. Everything we
              ship is built around determinism, observability, and Git-native
              workflows. That's the bet.
            </p>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">
              — Randy Jordan, Mobile, AL
            </p>
          </div>
        </div>
      </Section>

      <ProductCTA
        eyebrow="Collaborate"
        title="We're hiring partners, not employees yet."
        description="Design partners, pilot customers, and technical collaborators. Reach out — we read everything."
        primaryCta={{ href: "/waitlist", label: "Get on the waitlist" }}
        secondaryCta={{ href: "/support", label: "Contact the lab" }}
      />
    </>
  );
}
