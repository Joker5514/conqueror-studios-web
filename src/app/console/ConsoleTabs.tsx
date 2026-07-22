"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/console", label: "Run" },
  { href: "/console/agents", label: "Agents" },
  { href: "/console/waitlist", label: "Waitlist" },
  { href: "/console/settings", label: "Settings" },
  { href: "/console/waitlist", label: "Waitlist" },
] as const;

export default function ConsoleTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Console sections" className="flex items-center gap-1">
      {TABS.map((tab) => {
        const active =
          tab.href === "/console"
            ? pathname === "/console"
            : pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`rounded px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
              active
                ? "bg-white/[0.06] text-white"
                : "text-white/35 hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
