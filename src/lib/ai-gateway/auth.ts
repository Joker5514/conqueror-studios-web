import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import {
  GATEWAY_AUTH_HEADER_NAME,
  GATEWAY_SECRET_ENV,
} from "./constants";

/**
 * Constant-time string compare via SHA-256 digests so unequal lengths
 * do not short-circuit on Buffer length.
 */
export function secretsEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

export type GatewayAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string; code: string };

/**
 * Require GATEWAY_SECRET env and matching X-Gateway-Secret header.
 * Does not log secret values.
 */
export function authorizeGatewayRequest(req: NextRequest): GatewayAuthResult {
  const configured = process.env[GATEWAY_SECRET_ENV]?.trim();
  if (!configured) {
    return {
      ok: false,
      status: 503,
      error: "AI gateway is not configured",
      code: "gateway_misconfigured",
    };
  }

  // Node/undici lower-cases header names; also accept exact constant for clarity.
  const provided =
    req.headers.get(GATEWAY_AUTH_HEADER_NAME) ??
    req.headers.get(GATEWAY_AUTH_HEADER_NAME.toLowerCase()) ??
    req.headers.get("x-gateway-secret");

  if (!provided || !secretsEqual(provided, configured)) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized",
      code: "unauthorized",
    };
  }

  return { ok: true };
}
