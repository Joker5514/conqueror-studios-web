import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * src/app/api/nexus/route.ts
 *
 * Server-side proxy to OrchestrAI Nexus /run.
 *
 * Architecture rule: this is the ONLY place NEXUS_URL is used.
 * The browser never sees the Nexus service URL.
 *
 * POST { query: string, context?: object }
 * → { correlation_id, routing_mode, result, trace }
 */

const NEXUS_URL = process.env.NEXUS_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { query?: string; context?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.query?.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  // ── Proxy to Nexus ────────────────────────────────────────────────────────
  const correlationId = crypto.randomUUID();

  let nexusRes: Response;
  try {
    nexusRes = await fetch(`${NEXUS_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        query: body.query,
        correlation_id: correlationId,
        context: body.context ?? null,
      }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Nexus service unreachable", detail: String(err) },
      { status: 502 },
    );
  }

  const data: unknown = await nexusRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: nexusRes.status });
}
