"use client";

import Link from "next/link";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6" role="alert">
      <div className="mx-auto max-w-md text-center">
        <span className="eyebrow">Something broke</span>
        <h1 className="mt-4 text-3xl font-medium tracking-tight text-white">
          This page hit an error.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-white/70">
          The problem was logged. Try again, or head back to the homepage.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-[11px] text-white/50">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={reset} className="cs-btn-deploy">
            Try again
          </button>
          <Link href="/" className="cs-btn-outline">
            Go home
          </Link>
        </div>
      </div>
    </section>
  );
}
