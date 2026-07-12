"use server";

import { headers } from "next/headers";
import { sendTemplatedEmail } from "@/lib/postmark/send";
import { tryGetSupabaseServerEnv } from "@/lib/supabase/server-env";
import { rateLimit } from "@/lib/rateLimit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type WaitlistSignupResult =
  | { ok: true }
  | { ok: false; error: string };

export async function signUpForWaitlist(
  formData: FormData,
): Promise<WaitlistSignupResult> {
  // ── Rate limiting — 3 submissions per IP per minute ──────────────────────
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "unknown";
  const limit = rateLimit(`waitlist:${ip}`, { windowMs: 60_000, max: 3 });
  if (!limit.ok) {
    return { ok: false, error: "Too many requests. Please wait a minute before trying again." };
  }

  const rawEmail = formData.get("email");
  if (typeof rawEmail !== "string") {
    return { ok: false, error: "Email is required." };
  }
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "That doesn't look like a valid email." };
  }

  const name = ((formData.get("name") as string | null) ?? "").trim();
  const org = ((formData.get("org") as string | null) ?? "").trim();
  const interests = formData.getAll("interest") as string[];
  const message = ((formData.get("message") as string | null) ?? "").trim();

  // Persist to Supabase when fully configured. Guard on the service-role key
  // explicitly — tryGetSupabaseServerEnv() returns truthy even when only the
  // anon key is present, but createAdminClient() requires the service-role key
  // and will throw without it.
  const serverEnv = tryGetSupabaseServerEnv();
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (serverEnv && hasServiceKey) {
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const supabase = createAdminClient();
      const { error } = await supabase.from("waitlist").upsert(
        {
          email,
          name: name || null,
          org: org || null,
          interests: interests.length ? interests : null,
          message: message || null,
        },
        { onConflict: "email" },
      );
      if (error) {
        console.error("Waitlist upsert failed", error);
        return { ok: false, error: "Failed to save your signup. Please try again." };
      }
    } catch (err) {
      console.error("Waitlist Supabase error", err);
      return { ok: false, error: "A server error occurred. Please try again." };
    }
  }

  // Send confirmation email when Postmark is configured. A missing or
  // mis-configured Postmark setup is non-fatal — the signup is already
  // recorded in the database.
  try {
    await sendTemplatedEmail({
      to: email,
      templateAlias: "welcome-email",
      templateModel: {
        product_name: "Conqueror Studios",
        first_name: name || email.split("@")[0],
        next_step:
          "We'll be in touch when the next cohort opens. In the meantime, the lab posts updates on GitHub.",
        cta_url: "https://conquerorstudios.dev/projects",
        cta_label: "Explore the lab",
        support_email: "r.jordan@conqueror-studios.com",
      },
    });
  } catch (err) {
    // Postmark not configured or transient failure — not fatal.
    console.warn("Waitlist confirmation email skipped:", (err as Error).message);
  }

  return { ok: true };
}
