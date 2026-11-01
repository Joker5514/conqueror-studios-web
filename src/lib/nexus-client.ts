import { readServerHttpUrl } from "@/lib/server-url";
import { log } from "@/lib/log";

/**
 * Server-side OrchestrAI Nexus client.
 * NEXUS_URL is read only in this module. UI code calls /api/nexus or
 * /api/agents/[id]/run, never the upstream URL.
 */

const NEXUS_TIMEOUT_MS = 60_000;
const MAX_RESPONSE_CHARS = 1_000_000;

export type NexusCallResult =
  | { ok: true; status: number; data: unknown }
  | { ok: false; status: number; error: string; code: string };

export function nexusBaseUrl(): ReturnType<typeof readServerHttpUrl> {
  return readServerHttpUrl(process.env.NEXUS_URL);
}

export async function postNexusRun(body: unknown): Promise<NexusCallResult> {
  const base = nexusBaseUrl();
  if (!base.ok) {
    return {
      ok: false,
      status: 503,
      error: "Nexus is not configured",
      code: base.reason === "insecure" ? "nexus_insecure" : "nexus_misconfigured",
    };
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const sharedSecret = process.env.NEXUS_SHARED_SECRET?.trim();
  if (sharedSecret) headers["X-Nexus-Secret"] = sharedSecret;

  let res: Response;
  try {
    res = await fetch(`${base.href}/run`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(NEXUS_TIMEOUT_MS),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    const timedOut = name === "TimeoutError" || name === "AbortError";
    log.error("nexus.request_failed", { reason: timedOut ? "timeout" : name || "network" });
    return {
      ok: false,
      status: timedOut ? 504 : 502,
      error: timedOut ? "Nexus request timed out" : "Nexus service unreachable",
      code: timedOut ? "nexus_timeout" : "nexus_unreachable",
    };
  }

  const text = await res.text();
  if (text.length > MAX_RESPONSE_CHARS) {
    return {
      ok: false,
      status: 502,
      error: "Nexus response too large",
      code: "nexus_response_too_large",
    };
  }

  let data: unknown = {};
  if (text.length > 0) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      log.error("nexus.non_json_response", { status: res.status });
      return {
        ok: false,
        status: 502,
        error: "Nexus returned an invalid response",
        code: "nexus_invalid_response",
      };
    }
  }

  if (!res.ok) {
    log.error("nexus.upstream_error", { status: res.status });
    const authFailed = res.status === 401 || res.status === 403;
    return {
      ok: false,
      status: res.status === 504 ? 504 : 502,
      error: authFailed ? "Nexus rejected this service's credentials" : "Nexus returned an error",
      code: authFailed ? "nexus_auth_failed" : "nexus_upstream_error",
    };
  }

  return { ok: true, status: res.status, data };
}
