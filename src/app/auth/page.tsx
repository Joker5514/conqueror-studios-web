/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import AuthForm from "./AuthForm";

export const metadata: Metadata = {
  title: "Sign in — Owner Console",
  description: "Sign in to the Conqueror Studios owner console.",
};

export default function AuthPage() {
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
        </div>
        <AuthForm />
      </div>
    </section>
  );
}
