/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Confidential — Project under NDA",
  description: "A Conqueror Studios project currently under NDA. Details available to qualified partners.",
};

export default function ConfidentialPage() {
  return (
    <>
      <Section className="relative overflow-hidden border-b border-white/10 py-24">
        <div className="grid-bg absolute inset-0 -z-10" />
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">Restricted</span>
          <h1 className="mt-4 text-balance text-4xl font-medium tracking-tight sm:text-5xl">
            A project we can't name yet.
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-white/65">
            One of the lab's most ambitious bets is currently under NDA. We can
            share details with qualified partners, investors, and collaborators
            under a mutual NDA.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/support" className="btn btn-primary">
              Request a briefing
            </Link>
            <Link href="/projects" className="btn btn-secondary">
              See what's public
            </Link>
          </div>
        </div>
      </Section>

      <Section className="py-20">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] md:grid-cols-3">
          {[
            ["Domain", "Agentic infrastructure"],
            ["Stage", "Private alpha"],
            ["Partners", "By invitation"],
          ].map(([t, v]) => (
            <div key={t} className="bg-[#0a0a10] p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">{t}</div>
              <div className="mt-2 text-[15px] text-white">{v}</div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
