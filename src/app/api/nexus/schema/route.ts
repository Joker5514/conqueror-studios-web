import { type NextRequest, NextResponse } from "next/server";
import { getBridgeToolSchema } from "@/lib/bridge-client";
import { requireConsoleOwner } from "@/lib/console-owner";

/**
 * src/app/api/nexus/schema/route.ts
 *
 * Owner-gated proxy for AI Bridge GET /tools/schema.
 * BRIDGE_URL is read only by src/lib/bridge-client.ts.
 */

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const access = await requireConsoleOwner();
  if (!access.ok) return access.response;

  const result = await getBridgeToolSchema();
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}
