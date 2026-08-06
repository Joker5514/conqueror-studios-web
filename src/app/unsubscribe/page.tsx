import type { Metadata } from "next";
import { UnsubscribeForm } from "./UnsubscribeForm";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Unsubscribe from Conqueror Studios email updates.",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  return (
    <section className="relative overflow-hidden min-h-[60vh] flex items-center">
      <div className="grid-bg absolute inset-0 -z-10 opacity-40" />
      <div className="mx-auto w-full max-w-lg px-6 py-20">
        <span className="eyebrow">Email preferences</span>
        <h1 className="mt-4 text-balance text-4xl font-medium tracking-tight">
          Unsubscribe
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-white/55">
          Remove your email from the Conqueror Studios waitlist and stop
          receiving broadcast updates.
        </p>
        <div className="mt-8">
          <UnsubscribeForm searchParams={searchParams} />
        </div>
      </div>
    </section>
  );
}
