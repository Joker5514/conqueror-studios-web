/**
 * Map a signInWithOtp result to what the visitor sees, without revealing
 * whether an account exists. Supabase answers an unknown address with a 4xx
 * ("Signups not allowed for otp"); showing that text would enumerate
 * console accounts, so every non-rate-limit client error shows the same
 * neutral confirmation as a real send.
 */

export type OtpOutcome = { kind: "sent" } | { kind: "rate_limited" } | { kind: "failed" };

type OtpErrorLike = { status?: number; name?: string } | null | undefined;

export function otpOutcome(error: OtpErrorLike): OtpOutcome {
  if (!error) return { kind: "sent" };
  const status = typeof error.status === "number" ? error.status : 0;
  if (status === 429) return { kind: "rate_limited" };
  if (status >= 400 && status < 500) return { kind: "sent" };
  return { kind: "failed" };
}

export const OTP_MESSAGES = {
  rate_limited: "Too many sign-in attempts. Wait a minute and try again.",
  failed: "We couldn't send a sign-in link right now. Try again in a minute.",
} as const;
