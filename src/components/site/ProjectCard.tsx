import Link from "next/link";
import type { Project, ProjectStatus } from "@/lib/projects";

const statusStyles: Record<ProjectStatus, string> = {
  flagship: "border-[#e84040]/40 bg-[#e84040]/10 text-[#ff9090]",
  core: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  research: "border-[#0066ff]/40 bg-[#0066ff]/10 text-blue-200",
  experimental: "border-white/15 bg-white/5 text-white/55",
  in_study: "border-white/15 bg-white/5 text-white/55",
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
      className="group relative flex flex-col overflow-hidden border border-[#e84040]/15 bg-[#0a0a10] transition-all hover:border-[#e84040]/35 hover:shadow-[0_0_40px_-15px_rgba(232,64,64,0.4)]"
    >
      {/* HUD corner accents */}
      <span className="pointer-events-none absolute left-0 top-0 z-10 h-3 w-3 border-l-2 border-t-2 border-[#e84040]/55" />
      <span className="pointer-events-none absolute right-0 top-0 z-10 h-3 w-3 border-r-2 border-t-2 border-[#e84040]/55" />
      <span className="pointer-events-none absolute bottom-0 left-0 z-10 h-3 w-3 border-b-2 border-l-2 border-[#e84040]/55" />
      <span className="pointer-events-none absolute bottom-0 right-0 z-10 h-3 w-3 border-b-2 border-r-2 border-[#e84040]/55" />

      {project.image && (
        <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-[#e84040]/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.image}
            alt={`${project.name} preview`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
            {project.tag}
          </span>
          <span
            className={`border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] ${statusStyles[project.status]}`}
          >
            {project.statusLabel}
          </span>
        </div>
        <h3 className="font-orbitron text-[15px] font-bold uppercase tracking-tight text-white">
          {project.name}
        </h3>
        <p className="text-[13px] leading-relaxed text-white/50">
          {project.summary}
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {project.chips.map((c) => (
            <span key={c} className="chip text-[10px]">
              {c}
            </span>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-[#e84040]/10 pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/35 group-hover:text-white/60 transition-colors">
            {external ? "View on GitHub" : "Read more"}
          </span>
          <span className="text-[#e84040] text-sm transition-transform group-hover:translate-x-0.5">→</span>
        </div>
      </div>
    </Wrapper>
  );
}
