import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="mx-auto max-w-md text-center">
        <span className="eyebrow">404</span>
        <h1 className="mt-4 text-3xl font-medium tracking-tight text-white">
          That page doesn&apos;t exist.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-white/70">
          The link may be old, or the page moved. Everything public is reachable from
          the products index.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/projects" className="cs-btn-deploy">
            Browse products
          </Link>
          <Link href="/" className="cs-btn-outline">
            Go home
          </Link>
        </div>
      </div>
    </section>
  );
}
