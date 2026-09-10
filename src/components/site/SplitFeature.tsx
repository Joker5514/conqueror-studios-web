import type { ReactNode } from "react";

export default function SplitFeature({
  eyebrow,
  title,
  children,
  image,
  reverse,
  bullets,
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  image?: { src: string; alt: string };
  reverse?: boolean;
  bullets?: { title: string; body: ReactNode }[];
}) {
  return (
    <div
      className={`grid gap-12 lg:grid-cols-2 lg:items-center ${
        reverse ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      <div className="flex flex-col gap-5">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2 className="text-balance text-3xl font-medium tracking-tight sm:text-[36px] lg:leading-[1.1]">
          {title}
        </h2>
        {children && (
          <div className="text-[15px] leading-relaxed text-white/65">
            {children}
          </div>
        )}
        {bullets && bullets.length > 0 && (
          <ul className="mt-2 space-y-3">
            {bullets.map((b) => (
              <li key={b.title} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/15 text-[10px] text-[#ff3355]"
                >
                  →
                </span>
                <div>
                  <span className="text-[14px] font-medium text-white">
                    {b.title}
                  </span>
                  <span className="ml-1 text-[14px] text-white/55">
                    — {b.body}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {image && (
        <div className="panel-strong overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.src} alt={image.alt} className="aspect-[4/3] w-full object-cover" />
        </div>
      )}
    </div>
  );
}
