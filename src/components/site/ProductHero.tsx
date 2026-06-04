import Link from "next/link";
import type { ReactNode } from "react";

export default function ProductHero({
  eyebrow,
  title,
  description,
  status,
  primaryCta,
  secondaryCta,
  image,
  chips,
}: {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  status?: string;
  primaryCta?: { href: string; label: string; external?: boolean };
  secondaryCta?: { href: string; label: string; external?: boolean };
  image?: { src: string; alt: string };
  chips?: string[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="grid-bg absolute inset-0 -z-10" />
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-16 sm:pt-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="eyebrow">{eyebrow}</span>
              {status && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">
                  <span className="status-dot" /> {status}
                </span>
              )}
            </div>
            <h1 className="text-balance text-4xl font-medium tracking-tight sm:text-5xl lg:text-[60px] lg:leading-[1.02]">
              {title}
            </h1>
            <p className="text-pretty max-w-xl text-[16px] leading-relaxed text-white/65">
              {description}
            </p>
            {(primaryCta || secondaryCta) && (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {primaryCta &&
                  (primaryCta.external ? (
                    <a
                      href={primaryCta.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn btn-primary"
                    >
                      {primaryCta.label}
                    </a>
                  ) : (
                    <Link href={primaryCta.href} className="btn btn-primary">
                      {primaryCta.label}
                    </Link>
                  ))}
                {secondaryCta &&
                  (secondaryCta.external ? (
                    <a
                      href={secondaryCta.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn btn-secondary"
                    >
                      {secondaryCta.label}
                    </a>
                  ) : (
                    <Link href={secondaryCta.href} className="btn btn-secondary">
                      {secondaryCta.label}
                    </Link>
                  ))}
              </div>
            )}
            {chips && chips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {chips.map((c) => (
                  <span key={c} className="chip">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
          {image && (
            <div className="relative">
              <div className="panel-strong overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.src}
                  alt={image.alt}
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              <div className="pointer-events-none absolute -inset-x-8 -bottom-12 h-24 bg-gradient-to-t from-[#ff3355]/20 to-transparent blur-3xl" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
