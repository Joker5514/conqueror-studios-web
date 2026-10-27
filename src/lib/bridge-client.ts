import { readServerHttpUrl } from "@/lib/server-url";

/**
 * Server-side AI Bridge tools-schema client.
 * BRIDGE_URL is read only in this module.
 */

const BRIDGE_TIMEOUT_MS = 20_000;
const MAX_RESPONSE_CHARS = 1_000_000;

export type BridgeCallResult =
  | { ok: true; status: number; data: unknown }
  | { ok: false; status: number; error: string; code: string };

export async function getBridgeToolSchema(): Promise<BridgeCallResult> {
  const base = readServerHttpUrl(process.env.BRIDGE_URL);
  if (!base.ok) {
    return {
      ok: false,
      status: 503,
      error: "AI Bridge is not configured",
      code: base.reason === "insecure" ? "bridge_insecure" : "bridge_misconfigured",
    };
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  const sharedSecret = process.env.BRIDGE_SHARED_SECRET?.trim();
  if (sharedSecret) headers["X-Gateway-Secret"] = sharedSecret;

  let res: Response;
  try {
    res = await fetch(`${base.href}/tools/schema`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(BRIDGE_TIMEOUT_MS),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    const timedOut = name === "TimeoutError" || name === "AbortError";
    console.error("[bridge] schema request failed", timedOut ? "timeout" : name || "network");
    return {
      ok: false,
      status: timedOut ? 504 : 502,
      error: timedOut ? "AI Bridge request timed out" : "AI Bridge unreachable",
      code: timedOut ? "bridge_timeout" : "bridge_unreachable",
    };
  }

  const text = await res.text();
  if (text.length > MAX_RESPONSE_CHARS) {
    return {
      ok: false,
      status: 502,
      error: "AI Bridge response too large",
      code: "bridge_response_too_large",
    };
  }

  let data: unknown = {};
  if (text.length > 0) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      console.error("[bridge] non-JSON schema response", res.status);
      return {
        ok: false,
        status: 502,
        error: "AI Bridge returned an invalid response",
        code: "bridge_invalid_response",
      };
    }
  }

  return { ok: true, status: res.status, data };
}
