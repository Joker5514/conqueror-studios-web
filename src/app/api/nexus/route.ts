import { type NextRequest, NextResponse } from "next/server";
import { requireConsoleOwner } from "@/lib/console-owner";
import { postNexusRun } from "@/lib/nexus-client";
import { rateLimit } from "@/lib/rateLimit";

/**
 * src/app/api/nexus/route.ts
 *
 * Authenticated owner proxy to OrchestrAI Nexus POST /run.
 * The upstream URL is read only by src/lib/nexus-client.ts.
 *
 * POST { query: string, context?: object }
 * → Nexus JSON, or a stable error code. Upstream exception text is not returned.
 */

const MAX_QUERY_CHARS = 8_000;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const access = await requireConsoleOwner();
  if (!access.ok) return access.response;
  const { user } = access;

  const limit = rateLimit(`nexus:${user.id}`, { windowMs: 60_000, max: 20 });
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests", code: "rate_limited" }, { status: 429 });
  }

  let body: { query?: string; context?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", code: "invalid_json" }, { status: 400 });
  }

  const query = body.query?.trim() ?? "";
  if (!query) {
    return NextResponse.json({ error: "query is required", code: "invalid_query" }, { status: 400 });
  }
  if (query.length > MAX_QUERY_CHARS) {
    return NextResponse.json({ error: "query is too long", code: "payload_too_large" }, { status: 400 });
  }

  const correlationId = crypto.randomUUID();
  const result = await postNexusRun({
    user_id: user.id,
    query,
    correlation_id: correlationId,
    context: body.context ?? null,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code, correlation_id: correlationId },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}
