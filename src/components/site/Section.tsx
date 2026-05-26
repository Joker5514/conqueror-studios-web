import type { ReactNode } from "react";

export function Section({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`mx-auto max-w-7xl px-6 ${className}`}>
      {children}
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div
      className={`flex max-w-3xl flex-col gap-3 ${
        align === "center" ? "mx-auto text-center" : ""
      }`}
    >
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h2 className="text-balance text-3xl font-medium tracking-tight sm:text-4xl lg:text-[44px] lg:leading-[1.05]">
        {title}
      </h2>
      {description && (
        <p className="text-pretty text-[15px] leading-relaxed text-white/60">
          {description}
        </p>
      )}
    </div>
  );
}
