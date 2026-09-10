import Link from "next/link";
import type { ReactNode } from "react";

export default function ProductCTA({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  primaryCta?: { href: string; label: string; external?: boolean };
  secondaryCta?: { href: string; label: string; external?: boolean };
}) {
  return (
    <section className="border-y border-white/10 bg-gradient-to-b from-transparent via-[#0a0a10] to-transparent">
      <div className="mx-auto max-w-5xl px-6 py-20 text-center">
        {eyebrow && <div className="eyebrow mb-4">{eyebrow}</div>}
        <h2 className="text-balance text-3xl font-medium tracking-tight sm:text-4xl lg:text-[44px]">
          {title}
        </h2>
        {description && (
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/60">
            {description}
          </p>
        )}
        {(primaryCta || secondaryCta) && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
      </div>
    </section>
  );
}
