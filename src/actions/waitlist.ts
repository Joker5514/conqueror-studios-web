"use server";

import { headers } from "next/headers";
import { sendTemplatedEmail } from "@/lib/postmark/send";
import { configuredSiteOrigin } from "@/lib/site-url";
import { tryGetSupabaseServerEnv } from "@/lib/supabase/server-env";
import { normalizeWaitlistInput } from "@/lib/waitlist-input";
import { rateLimit } from "@/lib/rateLimit";

export type WaitlistSignupResult =
  | { ok: true }
  | { ok: false; error: string };

export async function signUpForWaitlist(
  formData: FormData,
): Promise<WaitlistSignupResult> {
  // ── Rate limiting — 3 submissions per IP per minute ──────────────────────
  // On Vercel the real client IP is the *last* hop in x-forwarded-for
  // (leftmost values are client-controlled and spoofable).
  const headerStore = await headers();
  const xff = headerStore.get("x-forwarded-for");
  const xffParts = xff?.split(",").map((p) => p.trim()).filter(Boolean) ?? [];
  const ip =
    xffParts.at(-1) ??
    headerStore.get("x-real-ip")?.trim() ??
    null;
  if (!ip) {
    return { ok: false, error: "Unable to verify client. Please try again." };
  }
  const limit = rateLimit(`waitlist:${ip}`, { windowMs: 60_000, max: 3 });
  if (!limit.ok) {
    return { ok: false, error: "Too many requests. Please wait a minute before trying again." };
  }

  const rawEmail = formData.get("email");
  if (typeof rawEmail !== "string") {
    return { ok: false, error: "Email is required." };
  }

  const normalized = normalizeWaitlistInput({
    email: rawEmail,
    name: ((formData.get("name") as string | null) ?? ""),
    org: ((formData.get("org") as string | null) ?? ""),
    interests: formData.getAll("interest").filter((item): item is string => typeof item === "string"),
    message: ((formData.get("message") as string | null) ?? ""),
  });
  if (!normalized.ok) return normalized;

  const { email, name, org, interests, message } = normalized.value;

  // Do not report success when the row cannot be stored.
  const serverEnv = tryGetSupabaseServerEnv();
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!serverEnv || !hasServiceKey) {
    return { ok: false, error: "Waitlist storage is not configured." };
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    const { error } = await supabase.from("waitlist").insert({
      email,
      name,
      org,
      interests,
      message,
    });
    if (error) {
      if (error.code === "23505") return { ok: true };
      console.error("Waitlist insert failed", error);
      return { ok: false, error: "Failed to save your signup. Please try again." };
    }
  } catch (err) {
    console.error("Waitlist Supabase error", err);
    return { ok: false, error: "A server error occurred. Please try again." };
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
        cta_url: `${configuredSiteOrigin()}/projects`,
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
