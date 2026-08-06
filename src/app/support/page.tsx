import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHead } from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Support — Talk to the lab",
  description:
    "Contact Conqueror Studios for partnerships, pilots, press, or technical questions.",
};

const lanes = [
  {
    title: "Pilots & partnerships",
    body: "Design partner inquiries, pilot programs, joint development.",
    to: "mailto:r.jordan@conqueror-studios.com?subject=Pilot%20inquiry",
    cta: "Pitch a pilot",
  },
  {
    title: "Technical questions",
    body: "Issues, integrations, or architecture questions on a public repo.",
    to: "https://github.com/Joker5514",
    cta: "Open a GitHub issue",
    external: true,
  },
  {
    title: "Press & speaking",
    body: "Interviews, podcasts, conference talks, written features.",
    to: "mailto:r.jordan@conqueror-studios.com?subject=Press%20inquiry",
    cta: "Press contact",
  },
  {
    title: "Confidential briefings",
    body: "Background or NDA-gated briefings on early-stage projects.",
    to: "mailto:r.jordan@conqueror-studios.com?subject=Confidential%20briefing",
    cta: "Request briefing",
  },
];

export default function SupportPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="grid-bg absolute inset-0 -z-10" />
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-20">
          <span className="eyebrow">Contact</span>
          <h1 className="mt-4 text-balance text-5xl font-medium tracking-tight sm:text-6xl lg:text-[72px] lg:leading-[1.02]">
            Talk to the lab.
          </h1>
          <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-white/65">
            Pick the lane that fits. We answer real messages quickly and
            ignore the rest.
          </p>
        </div>
      </section>

      <Section className="py-20">
        <SectionHead eyebrow="Reach us" title="Pick a lane" />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {lanes.map((l) =>
            l.external ? (
              <a
                key={l.title}
                href={l.to}
                target="_blank"
                rel="noreferrer noopener"
                className="block"
              >
                <div className="panel p-6 transition-colors hover:border-white/25 hover:bg-white/[0.03]">
                  <div className="text-[15px] font-medium text-white">{l.title}</div>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/55">{l.body}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[13px]">
                    <span className="text-white/65">{l.cta}</span>
                    <span className="text-[#ff3355]">→</span>
                  </div>
                </div>
              </a>
            ) : (
              <Link key={l.title} href={l.to} className="block">
                <div className="panel p-6 transition-colors hover:border-white/25 hover:bg-white/[0.03]">
                  <div className="text-[15px] font-medium text-white">{l.title}</div>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/55">{l.body}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[13px]">
                    <span className="text-white/65">{l.cta}</span>
                    <span className="text-[#ff3355]">→</span>
                  </div>
                </div>
              </Link>
            )
          )}
        </div>
      </Section>

      <Section className="border-t border-white/10 py-20">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:grid-cols-3">
          {[
            ["Email", "r.jordan@conqueror-studios.com"],
            ["GitHub", "github.com/Joker5514"],
            ["Location", "Mobile, Alabama"],
          ].map(([t, v]) => (
            <div key={t} className="bg-[#0a0a10] p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">{t}</div>
              <div className="mt-2 font-mono text-[13px] text-white">{v}</div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
