/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import AuthForm from "./AuthForm";

export const metadata: Metadata = {
  title: "Sign in — Owner Console",
  description: "Sign in to the Conqueror Studios owner console.",
};

const ACCESS_ERRORS: Record<string, string> = {
  unauthorized: "This account cannot open the console.",
  console_unconfigured: "Console access is not configured on the server.",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const accessError = params.error ? ACCESS_ERRORS[params.error] : undefined;

  return (
    <section className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="eyebrow">Owner Console</span>
          <h1 className="mt-3 text-2xl font-medium tracking-tight text-white">
            Sign in
          </h1>
          <p className="mt-2 text-[14px] text-white/50">
            Enter your email — we'll send a magic link.
          </p>
          {accessError ? (
            <p className="mt-4 text-[13px] text-[#e84040]" role="alert">
              {accessError}
            </p>
          ) : null}
        </div>
        <AuthForm />
      </div>
    </section>
  );
}
