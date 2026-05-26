/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import { Section, SectionHead } from "@/components/site/Section";
import ProjectCard from "@/components/site/ProjectCard";
import ProductCTA from "@/components/site/ProductCTA";
import { flagshipProjects, inStudyProjects, repoCategories } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "The full Conqueror Studios portfolio: flagship platforms, active experiments, and open-source repositories across agent orchestration, voice AI, and federated tooling.",
};

export default function ProjectsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="grid-bg absolute inset-0 -z-10" />
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-20">
          <div className="flex flex-col gap-4">
            <span className="eyebrow">Portfolio</span>
            <h1 className="text-balance text-4xl font-medium tracking-tight sm:text-5xl lg:text-[60px] lg:leading-[1.02]">
              Every bet the lab is making, in one place.
            </h1>
            <p className="max-w-2xl text-[16px] leading-relaxed text-white/60">
              Flagships are production codebases on a launch path. Experiments
              are smaller wagers — fast to ship, fast to learn from.
            </p>
          </div>
        </div>
      </section>

      <Section className="py-20">
        <SectionHead eyebrow="Flagships" title="Production bets" />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {flagshipProjects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </Section>

      <Section className="border-t border-white/10 py-20">
        <SectionHead eyebrow="In study" title="Active experiments" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {inStudyProjects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </Section>

      <Section className="border-t border-white/10 py-20">
        <SectionHead
          eyebrow="Open source"
          title="Repository index"
          description="The lab's public Git surface, grouped by purpose."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
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
        title="Want to pilot one of these?"
        description="We're taking a small number of design partners. Tell us what you're building."
        primaryCta={{ href: "/waitlist", label: "Apply to pilot" }}
        secondaryCta={{ href: "/support", label: "Talk to the lab" }}
      />
    </>
  );
}
