import { createHmac, timingSafeEqual } from "node:crypto";

const UNSUBSCRIBE_TOKEN_SECRET_ENV = "UNSUBSCRIBE_TOKEN_SECRET";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getSecret(): string | null {
  return process.env[UNSUBSCRIBE_TOKEN_SECRET_ENV]?.trim() || null;
}

/** Creates a tamper-evident token for a specific waitlist recipient. */
export function createUnsubscribeToken(email: string): string | null {
  const secret = getSecret();
  if (!secret) return null;

  return createHmac("sha256", secret)
    .update(normalizeEmail(email), "utf8")
    .digest("base64url");
}

/** Verifies a recipient token without exposing the signing secret. */
export function isValidUnsubscribeToken(email: string, token: string): boolean {
  const expected = createUnsubscribeToken(email);
  if (!expected) return false;

  const expectedBuffer = Buffer.from(expected, "utf8");
  const tokenBuffer = Buffer.from(token, "utf8");
  return (
    expectedBuffer.length === tokenBuffer.length &&
    timingSafeEqual(expectedBuffer, tokenBuffer)
  );
}
