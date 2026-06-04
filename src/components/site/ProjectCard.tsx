import Link from "next/link";
import type { Project, ProjectStatus } from "@/lib/projects";

const statusStyles: Record<ProjectStatus, string> = {
  flagship: "border-[#ff3355]/30 bg-[#ff3355]/10 text-[#ff8da0]",
  core: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  research: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  experimental: "border-white/15 bg-white/5 text-white/65",
  in_study: "border-white/15 bg-white/5 text-white/65",
};

export default function ProjectCard({ project }: { project: Project }) {
  const external = project.href.startsWith("http");
  const Wrapper: React.ElementType = external ? "a" : Link;
  const wrapperProps = external
    ? { href: project.href, target: "_blank", rel: "noreferrer noopener" }
    : { href: project.href };

  return (
    <Wrapper
      {...wrapperProps}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a10] transition-colors hover:border-white/20 hover:bg-[#0e0e15]"
    >
      {project.image && (
        <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.image}
            alt={`${project.name} preview`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
            {project.tag}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${statusStyles[project.status]}`}
          >
            {project.statusLabel}
          </span>
        </div>
        <h3 className="text-lg font-medium tracking-tight text-white">
          {project.name}
        </h3>
        <p className="text-[14px] leading-relaxed text-white/55">
          {project.summary}
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {project.chips.map((c) => (
            <span key={c} className="chip">
              {c}
            </span>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-3 text-[13px]">
          <span className="text-white/40 group-hover:text-white/70">
            {external ? "View on GitHub" : "Read more"}
          </span>
          <span className="text-[#ff3355] transition-transform group-hover:translate-x-0.5">→</span>
        </div>
      </div>
    </Wrapper>
  );
}
