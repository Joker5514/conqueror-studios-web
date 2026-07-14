"use client";

import { useQuery } from "@tanstack/react-query";
import type { WaitlistRow } from "@/app/api/console/waitlist/route";

/**
 * src/hooks/api/useConsoleWaitlist.ts
 *
 * React Query hook for the /api/console/waitlist endpoint.
 * Used by the console waitlist sub-page.
 */

async function fetchWaitlist(limit = 100, offset = 0): Promise<{ rows: WaitlistRow[]; total: number }> {
  const res = await fetch(`/api/console/waitlist?limit=${limit}&offset=${offset}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<{ rows: WaitlistRow[]; total: number }>;
}

export function useConsoleWaitlist(limit = 100, offset = 0) {
  return useQuery({
    queryKey: ["console", "waitlist", limit, offset],
    queryFn: () => fetchWaitlist(limit, offset),
    staleTime: 30_000,
  });
}
