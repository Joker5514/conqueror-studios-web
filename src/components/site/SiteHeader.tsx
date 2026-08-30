"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useMountEffect } from "@/hooks/useMountEffect";

const navLinks = [
  { href: "/projects", label: "Products" },
  { href: "/agents", label: "Agents" },
  { href: "/studio", label: "Studio" },
  { href: "/support", label: "Support" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useMountEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  });

  return (
    <header
      className={`sticky top-0 z-50 transition-colors ${
        scrolled
          ? "border-b border-[#e84040]/15 bg-black/70 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
        <Link
          href="/"
          className="group flex items-center"
          aria-label="Conqueror Studios home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/conqueror-logo.png"
            alt="Conqueror Studios"
            className="h-11 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-mono px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                  active
                    ? "text-white"
                    : "text-white/45 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="https://github.com/Joker5514"
            target="_blank"
            rel="noreferrer noopener"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40 transition-colors hover:text-white"
          >
            GitHub
          </Link>
          <Link href="/auth" className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55 transition-colors hover:text-white">
            Sign in
          </Link>
          <Link href="/waitlist" className="cs-btn-deploy px-5 py-2.5 text-[10px]">
            Request access
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden flex h-9 w-9 items-center justify-center border border-[#e84040]/20 text-white/80 bg-[#0a0a10]"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
        >
          <span className="relative block h-3 w-4">
            <span
              className={`absolute left-0 top-0 h-px w-full bg-current transition-transform ${
                open ? "translate-y-1.5 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-1.5 h-px w-full bg-current transition-opacity ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 top-3 h-px w-full bg-current transition-transform ${
                open ? "-translate-y-1.5 -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {open && (
        <div className="border-t border-[#e84040]/15 bg-black/90 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono px-2 py-2.5 text-[11px] uppercase tracking-[0.14em] text-white/70 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/auth" className="font-mono px-2 py-2.5 text-[11px] uppercase tracking-[0.14em] text-white/70">
              Sign in
            </Link>
            <Link
              href="/waitlist"
              className="cs-btn-deploy mt-3 justify-center"
            >
              Request access
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
