import type { Metadata } from "next";
import { isAuthConfigured } from "@/lib/service-config";
import AuthForm from "./AuthForm";

export const metadata: Metadata = {
  title: "Sign in — Owner Console",
  description: "Sign in to the Conqueror Studios owner console.",
  robots: { index: false, follow: false },
};

const ACCESS_ERRORS: Record<string, string> = {
  unauthorized: "This account cannot open the console.",
  console_unconfigured: "Console access is not configured on the server.",
  auth_unconfigured: "Sign-in is not configured on this deployment.",
  auth_unavailable: "The sign-in service did not respond. Try again in a minute.",
  link_invalid: "That sign-in link is invalid or has expired. Request a new one below.",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const accessError = params.error ? ACCESS_ERRORS[params.error] : undefined;
  const configured = isAuthConfigured();

  return (
    <section className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="eyebrow">Owner Console</span>
          <h1 className="mt-3 text-2xl font-medium tracking-tight text-white">
            Sign in
          </h1>
          {configured ? (
            <p className="mt-2 text-[14px] text-white/60">
              Enter your email and we&apos;ll send a one-time sign-in link.
            </p>
          ) : null}
          {accessError && configured ? (
            <p className="mt-4 text-[13px] text-[#ff8a8a]" role="alert">
              {accessError}
            </p>
          ) : null}
        </div>
        {configured ? (
          <AuthForm />
        ) : (
          <div className="panel-strong p-6 text-center" role="status">
            <span className="eyebrow">Unavailable</span>
            <p className="mt-3 text-[14px] leading-relaxed text-white/70">
              Sign-in is not configured on this deployment, so the owner console
              is offline. Public pages are unaffected.
            </p>
            <p className="mt-3 text-[13px] text-white/55">
              Need access?{" "}
              <a className="underline underline-offset-4 hover:text-white" href="mailto:r.jordan@conqueror-studios.com?subject=Console%20access">
                Email the lab
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
