/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useTransition } from "react";
import { signUpForWaitlist } from "@/actions/waitlist";

const interests = [
  "AI Bridge",
  "OrchestrAI Nexus",
  "VoiceIsolate Pro",
  "AI Counselor",
  "Love-Me-Not",
  "Other",
];

export default function WaitlistForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await signUpForWaitlist(formData);
      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(result.error);
      }
    });
  }

  if (submitted) {
    return (
      <div className="panel-strong p-8">
        <span className="eyebrow">Received</span>
        <h2 className="mt-3 text-2xl font-medium tracking-tight text-white">
          You're on the list.
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-white/60">
          Thanks for the interest. We'll be in touch when the next cohort
          opens. In the meantime, the lab posts updates on{" "}
          <a
            href="https://github.com/Joker5514"
            className="text-[#e84040] hover:underline"
            target="_blank"
            rel="noreferrer noopener"
          >
            GitHub
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="panel-strong space-y-5 p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" required />
        <Field label="Email" name="email" type="email" required />
      </div>
      <Field label="Company or project" name="org" />
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
          Interested in
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {interests.map((i) => (
            <label
              key={i}
              className="cursor-pointer rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-[12px] text-white/70 transition-colors has-[:checked]:border-[#e84040] has-[:checked]:bg-[#e84040]/15 has-[:checked]:text-white"
            >
              <input type="checkbox" name="interest" value={i} className="hidden" />
              {i}
            </label>
          ))}
        </div>
      </div>
      <Field
        label="What are you building?"
        name="message"
        as="textarea"
        rows={5}
        placeholder="A short paragraph helps us route you to the right team."
      />
      {error ? (
        <p className="rounded-md border border-[#e84040]/30 bg-[#e84040]/10 px-4 py-3 text-[13px] text-[#e84040]">
          {error}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-[12px] text-white/45">
          By submitting you agree to receive occasional product updates. No
          spam.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary disabled:opacity-60"
        >
          {isPending ? "Submitting…" : "Request access"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  as,
  rows,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  as?: "textarea";
  rows?: number;
  placeholder?: string;
}) {
  const cls =
    "mt-2 w-full rounded-md border border-white/12 bg-white/[0.02] px-3 py-2.5 text-[14px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#e84040]";
  return (
    <label htmlFor={name} className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
        {label}
      </span>
      {as === "textarea" ? (
        <textarea
          id={name}
          name={name}
          required={required}
          rows={rows}
          placeholder={placeholder}
          className={cls}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </label>
  );
}
