import { type NextRequest, NextResponse } from "next/server";
import { authorizeGatewayRequest } from "@/lib/ai-gateway/auth";
import {
  AI_GATEWAY_MODE_ENV,
  AI_GATEWAY_UPSTREAM_URL_ENV,
  GATEWAY_AUTH_HEADER_NAME,
  PROVIDER_ALIASES,
  type SupportedProvider,
  SUPPORTED_PROVIDERS,
} from "@/lib/ai-gateway/constants";
import { callProviderDirect, ProviderHttpError } from "@/lib/ai-gateway/providers";
import type {
  GatewayErrorResponse,
  GatewayMessage,
  GatewayRequestBody,
  GatewaySuccessResponse,
} from "@/lib/ai-gateway/types";
import { rateLimit } from "@/lib/rateLimit";

/**
 * POST /api/gateway
 *
 * Server-side AI gateway. Provider keys never leave this process.
 * Auth: shared secret header (see docs/ai-gateway.md).
 *
 * Body: { provider, model?, messages? | input?, temperature?, max_tokens? }
 * Response: { id, provider, model, output_text, usage? }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cap total prompt content to limit memory / token spend abuse. */
const MAX_MESSAGE_CHARS = 100_000;

const UPSTREAM_FETCH_TIMEOUT_MS = 60_000;

function jsonError(
  status: number,
  error: string,
  code?: string,
): NextResponse<GatewayErrorResponse> {
  return NextResponse.json(code ? { error, code } : { error }, { status });
}

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  const parts = xff?.split(",").map((p) => p.trim()).filter(Boolean) ?? [];
  // Prefer rightmost hop (same rationale as waitlist server action).
  return parts.at(-1) ?? req.headers.get("x-real-ip")?.trim() ?? "unknown";
}

function normalizeMessages(body: GatewayRequestBody): GatewayMessage[] | null {
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    const out: GatewayMessage[] = [];
    for (const m of body.messages) {
      if (!m || typeof m !== "object") return null;
      const role = m.role;
      const content = m.content;
      if (
        (role !== "system" && role !== "user" && role !== "assistant") ||
        typeof content !== "string"
      ) {
        return null;
      }
      out.push({ role, content });
    }
    return out;
  }
  if (typeof body.input === "string" && body.input.trim()) {
    return [{ role: "user", content: body.input.trim() }];
  }
  return null;
}

function resolveProvider(raw: unknown): SupportedProvider | null {
  if (!raw || typeof raw !== "string") return null;
  const key = raw.trim().toLowerCase();
  // Own-property check: avoid Object.prototype keys like "toString".
  if (!Object.hasOwn(PROVIDER_ALIASES, key)) return null;
  return PROVIDER_ALIASES[key] ?? null;
}

function gatewayMode(): "direct" | "upstream" {
  const mode = process.env[AI_GATEWAY_MODE_ENV]?.trim().toLowerCase();
  return mode === "upstream" ? "upstream" : "direct";
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

/** Allowlisted payload for upstream mode — never forward arbitrary client fields. */
function buildUpstreamPayload(
  provider: SupportedProvider,
  body: GatewayRequestBody,
  messages: GatewayMessage[],
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    provider,
    messages,
  };
  if (typeof body.model === "string") payload.model = body.model;
  if (typeof body.input === "string") payload.input = body.input;
  if (typeof body.temperature === "number") payload.temperature = body.temperature;
  if (typeof body.max_tokens === "number") payload.max_tokens = body.max_tokens;
  return payload;
}

async function forwardUpstream(
  payload: Record<string, unknown>,
  inboundSecretHeader: string | null,
): Promise<NextResponse> {
  const upstream = process.env[AI_GATEWAY_UPSTREAM_URL_ENV]?.trim();
  if (!upstream) {
    return jsonError(
      503,
      "AI gateway upstream is not configured",
      "upstream_misconfigured",
    );
  }

  let url: URL;
  try {
    url = new URL(upstream);
  } catch {
    return jsonError(503, "AI gateway upstream is not configured", "upstream_misconfigured");
  }

  if (url.protocol !== "https:" && !isLocalHostname(url.hostname)) {
    return jsonError(
      503,
      "AI gateway upstream must use HTTPS",
      "upstream_insecure",
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // Forward the same shared secret if the upstream uses the same contract.
  if (inboundSecretHeader) {
    headers[GATEWAY_AUTH_HEADER_NAME] = inboundSecretHeader;
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
    });
  } catch {
    return jsonError(502, "Upstream gateway unreachable", "upstream_unreachable");
  }

  let data: unknown;
  let parsedOk = true;
  try {
    data = await res.json();
  } catch {
    parsedOk = false;
    data = {
      error: "Invalid upstream response",
      code: "upstream_invalid_response",
    };
  }

  // Never return 2xx with an error body when JSON parse failed.
  const status = parsedOk ? res.status : res.ok ? 502 : res.status;
  return NextResponse.json(data, { status });
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<GatewaySuccessResponse | GatewayErrorResponse>> {
  // ── Rate limit first (covers auth failures / brute-force) ────────────────
  const ip = clientIp(req);
  const limit = rateLimit(`ai-gateway:${ip}`, { windowMs: 60_000, max: 30 });
  if (!limit.ok) {
    return jsonError(429, "Too many requests", "rate_limited");
  }

  // ── Auth (shared secret header) ───────────────────────────────────────────
  const auth = authorizeGatewayRequest(req);
  if (!auth.ok) {
    return jsonError(auth.status, auth.error, auth.code);
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body", "invalid_json");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return jsonError(400, "Invalid JSON body", "invalid_json");
  }

  const body = parsed as GatewayRequestBody;

  const provider = resolveProvider(body.provider);
  if (!provider) {
    return jsonError(
      400,
      `provider is required and must be one of: ${SUPPORTED_PROVIDERS.join(", ")}`,
      "invalid_provider",
    );
  }

  if (body.model !== undefined && typeof body.model !== "string") {
    return jsonError(400, "model must be a string", "invalid_model");
  }

  const messages = normalizeMessages(body);
  if (!messages) {
    return jsonError(
      400,
      "Provide non-empty messages[] or input string",
      "invalid_messages",
    );
  }

  const totalChars = messages.reduce((n, m) => n + m.content.length, 0);
  if (totalChars > MAX_MESSAGE_CHARS) {
    return jsonError(400, "messages exceed maximum size", "payload_too_large");
  }

  if (body.temperature !== undefined) {
    if (typeof body.temperature !== "number" || !Number.isFinite(body.temperature)) {
      return jsonError(400, "temperature must be a number between 0 and 2", "invalid_temperature");
    }
    if (body.temperature < 0 || body.temperature > 2) {
      return jsonError(400, "temperature must be between 0 and 2", "invalid_temperature");
    }
  }
  if (body.max_tokens !== undefined) {
    if (typeof body.max_tokens !== "number" || !Number.isFinite(body.max_tokens)) {
      return jsonError(400, "max_tokens must be a number", "invalid_max_tokens");
    }
    if (body.max_tokens < 1 || body.max_tokens > 128_000) {
      return jsonError(400, "max_tokens is out of range", "invalid_max_tokens");
    }
  }

  // ── Route: upstream proxy or direct providers ─────────────────────────────
  if (gatewayMode() === "upstream") {
    const secretHeader =
      req.headers.get(GATEWAY_AUTH_HEADER_NAME) ??
      req.headers.get("x-gateway-secret");
    return forwardUpstream(
      buildUpstreamPayload(provider, body, messages),
      secretHeader,
    ) as Promise<NextResponse<GatewaySuccessResponse | GatewayErrorResponse>>;
  }

  try {
    const result = await callProviderDirect({
      provider,
      model: body.model,
      messages,
      temperature: body.temperature,
      maxTokens: body.max_tokens,
    });
    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof ProviderHttpError) {
      return jsonError(err.status, err.message, err.code);
    }
    // Log message/stack only — no request bodies or headers.
    console.error(
      "[api/gateway] unexpected failure:",
      err instanceof Error ? err.stack || err.message : "unknown",
    );
    return jsonError(500, "Internal server error", "internal_error");
  }
}
