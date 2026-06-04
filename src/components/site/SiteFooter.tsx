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
    <footer className="border-t border-[#e84040]/12 bg-black/40">
      <div className="mx-auto max-w-7xl px-6 pb-12 pt-14">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_repeat(4,1fr)]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/conqueror-logo.png"
              alt="Conqueror Studios"
              className="h-12 w-auto"
            />
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-white/45">
              A Git-native, multi-tenant AI agent platform. We treat every
              deployment as a long-running experiment.
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">
              Mobile, Alabama · Built in the open
            </p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/38">
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
                        className="text-[13px] text-white/55 hover:text-white transition-colors"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-[13px] text-white/55 hover:text-white transition-colors"
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

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-[#e84040]/10 pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/28">
            © {new Date().getFullYear()} Conqueror Studios. Independent AI R&amp;D.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/28">
            v0.1 · conqueror-studios-web
          </p>
        </div>
      </div>
    </footer>
  );
}
