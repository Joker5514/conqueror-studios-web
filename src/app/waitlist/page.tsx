/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import { Section } from "@/components/site/Section";
import WaitlistForm from "./WaitlistForm";

export const metadata: Metadata = {
  title: "Waitlist — Early access",
  description:
    "Join the Conqueror Studios waitlist for early access to AI Bridge, OrchestrAI Nexus, VoiceIsolate Pro, and other lab projects.",
};

export default function WaitlistPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="grid-bg absolute inset-0 -z-10" />
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-20">
          <span className="eyebrow">Early access</span>
          <h1 className="mt-4 text-balance text-5xl font-medium tracking-tight sm:text-6xl lg:text-[72px] lg:leading-[1.02]">
            Get on the list.
          </h1>
          <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-white/65">
            We onboard design partners in small cohorts. Tell us a little about
            you and what you're building, and we'll route you to the right
            product team.
          </p>
        </div>
      </section>

      <Section className="grid gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr]">
        <WaitlistForm />
        <aside className="space-y-6">
          <div className="panel p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
              What you'll get
            </div>
            <ul className="mt-4 space-y-3 text-[14px] text-white/65">
              <li>— Early access slots as cohorts open</li>
              <li>— Direct line to the product team during pilots</li>
              <li>— Quarterly research notes from the lab</li>
              <li>— No marketing email churn — only product updates</li>
            </ul>
          </div>
          <div className="panel p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
              We'll usually respond within
            </div>
            <div className="mt-2 text-2xl font-medium tracking-tight text-white">
              48 hours
            </div>
            <p className="mt-2 text-[13px] text-white/55">
              If you're working on something sensitive, mention NDA in the
              message and we'll start there.
            </p>
          </div>
        </aside>
      </Section>
    </>
  );
}
