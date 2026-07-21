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
 * Response: { id, provider, model, output_text, usage?, raw? }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function resolveProvider(raw: string | undefined): SupportedProvider | null {
  if (!raw || typeof raw !== "string") return null;
  const key = raw.trim().toLowerCase();
  return PROVIDER_ALIASES[key] ?? null;
}

function gatewayMode(): "direct" | "upstream" {
  const mode = process.env[AI_GATEWAY_MODE_ENV]?.trim().toLowerCase();
  return mode === "upstream" ? "upstream" : "direct";
}

async function forwardUpstream(
  body: GatewayRequestBody,
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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // Forward the same shared secret if the upstream uses the same contract.
  if (inboundSecretHeader) {
    headers[GATEWAY_AUTH_HEADER_NAME] = inboundSecretHeader;
  }

  let res: Response;
  try {
    res = await fetch(upstream, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    return jsonError(502, "Upstream gateway unreachable", "upstream_unreachable");
  }

  const data: unknown = await res.json().catch(() => ({
    error: "Invalid upstream response",
    code: "upstream_invalid_response",
  }));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<GatewaySuccessResponse | GatewayErrorResponse>> {
  // ── Auth (shared secret header) ───────────────────────────────────────────
  const auth = authorizeGatewayRequest(req);
  if (!auth.ok) {
    return jsonError(auth.status, auth.error, auth.code);
  }

  // ── Rate limit (per IP) ───────────────────────────────────────────────────
  const ip = clientIp(req);
  const limit = rateLimit(`ai-gateway:${ip}`, { windowMs: 60_000, max: 30 });
  if (!limit.ok) {
    return jsonError(429, "Too many requests", "rate_limited");
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: GatewayRequestBody;
  try {
    body = (await req.json()) as GatewayRequestBody;
  } catch {
    return jsonError(400, "Invalid JSON body", "invalid_json");
  }

  const provider = resolveProvider(body.provider);
  if (!provider) {
    return jsonError(
      400,
      `provider is required and must be one of: ${SUPPORTED_PROVIDERS.join(", ")}`,
      "invalid_provider",
    );
  }

  const messages = normalizeMessages(body);
  if (!messages) {
    return jsonError(
      400,
      "Provide non-empty messages[] or input string",
      "invalid_messages",
    );
  }

  if (typeof body.temperature === "number") {
    if (!Number.isFinite(body.temperature) || body.temperature < 0 || body.temperature > 2) {
      return jsonError(400, "temperature must be between 0 and 2", "invalid_temperature");
    }
  }
  if (typeof body.max_tokens === "number") {
    if (!Number.isFinite(body.max_tokens) || body.max_tokens < 1 || body.max_tokens > 128_000) {
      return jsonError(400, "max_tokens is out of range", "invalid_max_tokens");
    }
  }

  // ── Route: upstream proxy or direct providers ─────────────────────────────
  if (gatewayMode() === "upstream") {
    const secretHeader =
      req.headers.get(GATEWAY_AUTH_HEADER_NAME) ??
      req.headers.get("x-gateway-secret");
    return forwardUpstream({ ...body, provider }, secretHeader) as Promise<
      NextResponse<GatewaySuccessResponse | GatewayErrorResponse>
    >;
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
    // Do not log full error objects that might contain request material with secrets.
    console.error("[api/gateway] unexpected failure");
    return jsonError(500, "Internal server error", "internal_error");
  }
}
