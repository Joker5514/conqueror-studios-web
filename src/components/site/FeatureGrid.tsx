import type { ReactNode } from "react";

export type Feature = {
  title: string;
  description: ReactNode;
  icon?: ReactNode;
};

export default function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:grid-cols-2 lg:grid-cols-3">
      {features.map((f) => (
        <div
          key={f.title}
          className="flex flex-col gap-3 bg-[#0a0a10] p-6 transition-colors hover:bg-[#0f0f17]"
        >
          {f.icon && (
            <div className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/5 text-[#ff3355]">
              {f.icon}
            </div>
          )}
          <h3 className="text-[15px] font-medium tracking-tight text-white">
            {f.title}
          </h3>
          <p className="text-[14px] leading-relaxed text-white/55">
            {f.description}
          </p>
        </div>
      ))}
    </div>
  );
}
