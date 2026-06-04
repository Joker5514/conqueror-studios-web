import Link from "next/link";

const cols: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: "Lab",
    links: [
      { href: "/projects", label: "Projects" },
      { href: "/studio", label: "Studio" },
      { href: "/waitlist", label: "Waitlist" },
      { href: "/support", label: "Support" },
    ],
  },
  {
    title: "Flagships",
    links: [
      { href: "/aibridge", label: "AI Bridge" },
      { href: "/orchestrai", label: "OrchestrAI Nexus" },
      { href: "/voiceisolate", label: "VoiceIsolate Pro" },
      { href: "/aicounselor", label: "AI Counselor" },
    ],
  },
  {
    title: "Experiments",
    links: [
      { href: "/lovemenot", label: "Love-Me-Not" },
      { href: "/confidential", label: "Confidential" },
    ],
  },
  {
    title: "Elsewhere",
    links: [
      { href: "https://github.com/Joker5514", label: "GitHub", external: true },
      { href: "https://linkedin.com/in/randy-jordan", label: "LinkedIn", external: true },
      { href: "mailto:r.jordan@conqueror-studios.com", label: "Email", external: true },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/40">
      <div className="mx-auto max-w-7xl px-6 pb-12 pt-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-md border border-white/15 bg-gradient-to-br from-[#ff3355] to-[#7a0f1f] text-[12px] font-bold text-white">
                C
              </span>
              <span className="text-[13px] font-medium tracking-tight">
                Conqueror Studios
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-white/55">
              A Git-native, multi-tenant AI agent platform. We treat every
              deployment as a long-running experiment.
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-white/35">
              Mobile, Alabama · Built in the open
            </p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">
                {col.title}
              </div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-sm text-white/70 hover:text-white"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-sm text-white/70 hover:text-white"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-[12px] text-white/40 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Conqueror Studios. Independent AI R&amp;D.</p>
          <p className="font-mono uppercase tracking-[0.16em]">
            v0.1 · conqueror-studios-web
          </p>
        </div>
      </div>
    </footer>
  );
}
