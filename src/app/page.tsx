/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { Section, SectionHead } from "@/components/site/Section";
import ProductCTA from "@/components/site/ProductCTA";
import ProjectCard from "@/components/site/ProjectCard";
import { flagshipProjects, inStudyProjects, repoCategories } from "@/lib/projects";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="grid-bg absolute inset-0 -z-10" />
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 sm:pt-32">
          <div className="flex flex-col gap-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">Independent AI R&amp;D Lab</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">
                <span className="status-dot" />
                Mobile, Alabama
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">
                Founder · Randy Jordan
              </span>
            </div>

            <h1 className="text-balance text-5xl font-medium tracking-tight sm:text-6xl lg:text-[88px] lg:leading-[0.98]">
              Git-native agents.{" "}
              <span className="text-white/55">
                Voice-first interfaces. Federated by design.
              </span>
            </h1>

            <p className="max-w-2xl text-pretty text-[17px] leading-relaxed text-white/65">
              Conqueror Studios is a multi-tenant AI agent platform. We design
              instrumented multi-agent systems, voice-first UX, and federated
              architectures — built around determinism, transparency, and
              Git-native workflows.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/projects" className="btn btn-primary">
                Browse the lab
              </Link>
              <Link href="/aibridge" className="btn btn-secondary">
                Read about AI Bridge
              </Link>
              <Link href="/waitlist" className="link-arrow ml-1">
                Join the waitlist →
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:grid-cols-4">
              {[
                { k: "Flagship products", v: "4" },
                { k: "Repositories", v: "12+" },
                { k: "Modalities", v: "Text · Voice · Vision" },
                { k: "Status", v: "Pre-launch" },
              ].map((s) => (
                <div key={s.k} className="bg-[#0a0a10] p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
                    {s.k}
                  </div>
                  <div className="mt-1.5 text-lg font-medium tracking-tight text-white">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FLAGSHIPS */}
      <Section className="py-24">
        <SectionHead
          eyebrow="Flagship products"
          title="Four bets on what agents should feel like"
          description="Each flagship is a real production codebase — instrumented, evaluated, and iterated in the open."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {flagshipProjects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </Section>

      {/* THESIS */}
      <Section className="border-t border-white/10 py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <SectionHead
            eyebrow="Operating thesis"
            title={
              <>
                Agents should be <span className="text-white/55">composable, observable, and</span> Git-native.
              </>
            }
          />
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:grid-cols-2">
            {[
              {
                t: "Git-native everything",
                b: "Configs, prompts, agent state, and replays live in repos. Reviewable, diffable, revertable.",
              },
              {
                t: "Federated, not monolithic",
                b: "Specialized agents on a shared bus beat one mega-agent. Latency, cost, and accuracy improve together.",
              },
              {
                t: "Voice as a first-class surface",
                b: "Latency, prosody, and barge-in are product decisions. Voice isn't a wrapper; it's the interface.",
              },
              {
                t: "Determinism and evals",
                b: "Every flow ships with golden replays, regression suites, and drift detection from day one.",
              },
            ].map((x) => (
              <div key={x.t} className="bg-[#0a0a10] p-6">
                <div className="text-[15px] font-medium tracking-tight text-white">
                  {x.t}
                </div>
                <div className="mt-2 text-[14px] leading-relaxed text-white/55">
                  {x.b}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* IN STUDY */}
      <Section className="border-t border-white/10 py-24">
        <SectionHead
          eyebrow="In study"
          title="Experiments running in the lab"
          description="Smaller wagers — quick to ship, quick to learn from. Some graduate, some get shelved."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {inStudyProjects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </Section>

      {/* REPO INDEX */}
      <Section className="border-t border-white/10 py-24">
        <SectionHead
          eyebrow="Open-source repositories"
          title="Built in the open"
          description="A snapshot of the lab's public Git surface — grouped by what they do."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {repoCategories.map((cat) => (
            <div key={cat.title} className="panel p-6">
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${cat.dotClass}`} />
                <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/65">
                  {cat.title}
                </h3>
              </div>
              <ul className="mt-5 divide-y divide-white/5">
                {cat.entries.map((e) => (
                  <li key={e.name} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      {e.href ? (
                        <a
                          href={e.href}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="font-mono text-[13px] text-white hover:text-[#ff3355]"
                        >
                          {e.name}
                        </a>
                      ) : (
                        <span className="font-mono text-[13px] text-white">{e.name}</span>
                      )}
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                        {e.lang}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/55">{e.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <ProductCTA
        eyebrow="Build with us"
        title="Pilot partners, design partners, collaborators."
        description="If you're building agentic systems and care about determinism and observability, let's talk."
        primaryCta={{ href: "/waitlist", label: "Join the waitlist" }}
        secondaryCta={{ href: "/support", label: "Contact the lab" }}
      />
    </>
  );
}
