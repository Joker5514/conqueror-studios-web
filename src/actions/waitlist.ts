"use server";

import { sendTemplatedEmail } from "@/lib/postmark/send";
import { tryGetSupabaseServerEnv } from "@/lib/supabase/server-env";
import { WAITLIST_INTERESTS, WAITLIST_MAX_LENGTHS } from "@/lib/waitlist";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_INTERESTS = new Set<string>(WAITLIST_INTERESTS);

export type WaitlistSignupResult =
  | { ok: true }
  | { ok: false; error: string };

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signUpForWaitlist(
  formData: FormData,
): Promise<WaitlistSignupResult> {
  // Honeypot: a hidden field real users never see. Bots that fill every input
  // trip it. Pretend success so we don't reveal the trap, but do nothing.
  if (readField(formData, "website")) {
    return { ok: true };
  }

  const rawEmail = formData.get("email");
  if (typeof rawEmail !== "string") {
    return { ok: false, error: "Email is required." };
  }
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > WAITLIST_MAX_LENGTHS.email) {
    return { ok: false, error: "That doesn't look like a valid email." };
  }

  // Bound free-text fields and whitelist interests so a single request can't
  // store oversized or arbitrary values.
  const name = readField(formData, "name").slice(0, WAITLIST_MAX_LENGTHS.name);
  const org = readField(formData, "org").slice(0, WAITLIST_MAX_LENGTHS.org);
  const message = readField(formData, "message").slice(
    0,
    WAITLIST_MAX_LENGTHS.message,
  );
  const interests = (formData.getAll("interest") as string[]).filter(
    (interest) => ALLOWED_INTERESTS.has(interest),
  );

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
  } else {
    // No database configured: the signup is not persisted. Surface this loudly
    // so a misconfigured deploy doesn't silently drop signups while still
    // returning success to the user.
    console.warn(
      "Waitlist not persisted: Supabase server env or service-role key is missing.",
    );
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
