import type { Metadata } from "next";
import Link from "next/link";
import HudCorners from "@/components/site/HudCorners";
import ProjectCard from "@/components/site/ProjectCard";
import { flagshipProjects, inStudyProjects, repoCategories } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Conqueror Studios — Git-native AI agent platform",
  description:
    "Independent AI R&D lab building multi-agent orchestration, voice-first interfaces, and federated agentic architectures. OrchestrAI Nexus · AI Bridge · VoiceIsolate Pro.",
  openGraph: {
    title: "Conqueror Studios — Git-native AI agent platform",
    description:
      "Independent AI R&D lab building multi-agent orchestration, voice-first interfaces, and federated agentic architectures.",
    url: "https://conquerorstudios.dev",
  },
};

export default function HomePage() {
  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Backgrounds */}
        <div className="cs-grid-bg absolute inset-0 -z-10" />
        <div className="absolute -left-60 -top-60 -z-10 h-[900px] w-[900px] rounded-full bg-[radial-gradient(circle,rgba(232,64,64,0.09)_0%,transparent_65%)]" />
        <div className="absolute -right-40 -top-20 -z-10 h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle,rgba(0,102,255,0.07)_0%,transparent_65%)]" />

        <div className="mx-auto max-w-7xl px-6 pt-16 pb-0 lg:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">

            {/* Left: Headline + CTAs */}
            <div className="flex flex-col gap-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="cs-eyebrow">[ Independent AI R&amp;D Lab ]</span>
                <span className="cs-chip">
                  <span className="status-dot" />
                  Mobile, Alabama
                </span>
                <span className="cs-chip">Founder · Randy Jordan</span>
              </div>

              <div className="leading-[0.92]">
                <h1 className="font-orbitron text-[clamp(2.8rem,7.5vw,5.5rem)] font-black uppercase tracking-tight text-white">
                  CONQUER
                </h1>
                <h1 className="font-orbitron text-[clamp(2.8rem,7.5vw,5.5rem)] font-black uppercase tracking-tight text-[#e84040]">
                  THE SYSTEM
                </h1>
              </div>

              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/35">
                ── Build. Orchestrate. Ship. ──
              </p>

              <p className="max-w-lg text-[17px] leading-relaxed text-white/58">
                Conqueror Studios is a multi-tenant AI agent platform. We design
                instrumented multi-agent systems, voice-first UX, and federated
                architectures — built around determinism, transparency, and
                Git-native workflows.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link href="/projects" className="cs-btn-deploy">
                  DEPLOY AGENT →
                </Link>
                <Link href="/aibridge" className="cs-btn-outline">
                  VIEW AI BRIDGE
                </Link>
                <Link href="/waitlist" className="cs-link-arrow ml-1">
                  JOIN WAITLIST →
                </Link>
              </div>
            </div>

            {/* Right: Logo */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[500px] lg:max-w-[580px]">
                <div className="absolute inset-0 -z-10 scale-75 bg-[radial-gradient(circle,rgba(0,102,255,0.22)_0%,transparent_70%)] blur-3xl" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/conqueror-logo.png"
                  alt="Conqueror Studios"
                  className="w-full drop-shadow-[0_0_50px_rgba(0,102,255,0.25)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mx-auto mt-10 max-w-7xl px-6 pb-16">
          <div className="relative">
            <HudCorners color="#e84040" size={10} opacity={0.6} />
            <div className="grid grid-cols-2 gap-px border border-[#e84040]/18 bg-[#e84040]/8 sm:grid-cols-4">
              {[
                { k: "FLAGSHIP PRODUCTS", v: "04" },
                { k: "REPOSITORIES", v: "12+" },
                { k: "MODALITIES", v: "TEXT · VOICE · VISION" },
                { k: "CURRENT STATUS", v: "PRE-LAUNCH" },
              ].map((s) => (
                <div key={s.k} className="bg-[#07070a] p-5">
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#e84040]/65">
                    {s.k}
                  </div>
                  <div className="mt-2 font-mono text-lg font-bold tracking-tight text-white">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FLAGSHIP SYSTEMS ─────────────────────────────────── */}
      <section className="border-t border-[#e84040]/10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <div className="cs-eyebrow mb-3">[ FLAGSHIP SYSTEMS ]</div>
              <h2 className="font-orbitron text-3xl font-bold uppercase tracking-tight lg:text-4xl">
                Four Bets on What
                <br />
                <span className="text-[#e84040]">Agents Should Feel Like</span>
              </h2>
            </div>
            <Link href="/projects" className="cs-link-arrow hidden sm:flex">
              VIEW ALL →
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {flagshipProjects.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── OPERATING THESIS ─────────────────────────────────── */}
      <section className="border-t border-[#e84040]/10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div className="flex flex-col justify-center">
              <div className="cs-eyebrow mb-3">[ OPERATING THESIS ]</div>
              <h2 className="font-orbitron text-3xl font-bold uppercase tracking-tight lg:text-4xl">
                Composable.
                <br />
                Observable.
                <br />
                <span className="text-[#e84040]">Git-Native.</span>
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {([
                {
                  t: "Git-native everything",
                  b: "Configs, prompts, agent state, and replays live in repos. Reviewable, diffable, revertable.",
                  accent: "#e84040",
                },
                {
                  t: "Federated, not monolithic",
                  b: "Specialized agents on a shared bus beat one mega-agent. Latency, cost, and accuracy improve together.",
                  accent: "#0066ff",
                },
                {
                  t: "Voice as first-class surface",
                  b: "Latency, prosody, and barge-in are product decisions. Voice isn't a wrapper; it's the interface.",
                  accent: "#ff6b00",
                },
                {
                  t: "Determinism and evals",
                  b: "Every flow ships with golden replays, regression suites, and drift detection from day one.",
                  accent: "#ffffff",
                },
              ] as const).map((x) => (
                <div
                  key={x.t}
                  className="relative bg-[#0a0a12] p-5"
                  style={{ border: `1px solid ${x.accent}28` }}
                >
                  <HudCorners color={x.accent} size={8} opacity={0.65} />
                  <div className="mt-0 text-[14px] font-medium tracking-tight text-white">
                    {x.t}
                  </div>
                  <div className="mt-2 text-[13px] leading-relaxed text-white/48">
                    {x.b}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── IN STUDY ─────────────────────────────────────────── */}
      <section className="border-t border-[#e84040]/10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="cs-eyebrow mb-3">[ IN STUDY ]</div>
          <div className="mb-12 flex items-end justify-between gap-6">
            <h2 className="font-orbitron text-3xl font-bold uppercase tracking-tight lg:text-4xl">
              Experiments Running
              <br />
              <span className="text-white/35">in the Lab</span>
            </h2>
            <p className="hidden max-w-xs text-right text-[13px] leading-relaxed text-white/40 sm:block">
              Smaller wagers — quick to ship, quick to learn from.
              Some graduate, some get shelved.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {inStudyProjects.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── OPEN-SOURCE REPOS ────────────────────────────────── */}
      <section className="border-t border-[#e84040]/10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="cs-eyebrow mb-3">[ OPEN-SOURCE REPOSITORIES ]</div>
          <div className="mb-12 flex items-end justify-between gap-6">
            <h2 className="font-orbitron text-3xl font-bold uppercase tracking-tight lg:text-4xl">
              Built in the Open
            </h2>
            <p className="hidden max-w-xs text-right text-[13px] leading-relaxed text-white/40 sm:block">
              A snapshot of the lab&apos;s public Git surface — grouped by what they do.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {repoCategories.map((cat) => (
              <div
                key={cat.title}
                className="relative border border-white/8 bg-[#0a0a10] p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${cat.dotClass}`} />
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
                    {cat.title}
                  </h3>
                </div>
                <ul className="divide-y divide-white/5">
                  {cat.entries.map((e) => (
                    <li key={e.name} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        {e.href ? (
                          <a
                            href={e.href}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="font-mono text-[12px] text-white/80 transition-colors hover:text-[#e84040]"
                          >
                            {e.name}
                          </a>
                        ) : (
                          <span className="font-mono text-[12px] text-white/80">{e.name}</span>
                        )}
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
                          {e.lang}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-white/40">{e.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="border-t border-[#e84040]/15 py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="cs-eyebrow mb-6">[ BUILD WITH US ]</div>
          <h2 className="font-orbitron text-4xl font-black uppercase tracking-tight lg:text-5xl">
            Pilot Partners.
            <br />
            Design Partners.
            <br />
            <span className="text-[#e84040]">Collaborators.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-white/52">
            If you&apos;re building agentic systems and care about determinism and
            observability, let&apos;s talk.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/waitlist" className="cs-btn-deploy">
              JOIN THE WAITLIST →
            </Link>
            <Link href="/support" className="cs-btn-outline">
              CONTACT THE LAB
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
