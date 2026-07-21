"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * src/hooks/api/useConsoleSettings.ts
 *
 * Hooks for the /console/settings tab.
 *   useConsoleSettings  — GET env health + deploy info
 *   useConsoleBroadcast — POST broadcast email to all waitlist addresses
 */

// ── Settings (env health + deploy) ────────────────────────────────────────────

interface SettingsData {
  env: Record<string, boolean>;
  deploy: {
    version: string;
    env_name: string;
    region: string;
    nexus_url: string;
    bridge_url: string;
  };
}

async function fetchSettings(): Promise<SettingsData> {
  const res = await fetch("/api/console/settings");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<SettingsData>;
}

export function useConsoleSettings() {
  return useQuery({
    queryKey: ["console", "settings"],
    queryFn: fetchSettings,
    staleTime: 60_000,
  });
}

// ── Broadcast email ────────────────────────────────────────────────────────────

interface BroadcastPayload {
  headline: string;
  summary: string;
  cta_url: string;
  cta_label: string;
}

interface BroadcastResult {
  sent: number;
  failed: number;
  total: number;
  failures?: string[];
}

async function postBroadcast(payload: BroadcastPayload): Promise<BroadcastResult> {
  const res = await fetch("/api/console/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Broadcast failed: ${res.status}`);
  }
  return res.json() as Promise<BroadcastResult>;
}

export function useConsoleBroadcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postBroadcast,
    onSuccess: () => {
      // Refresh settings to reflect latest waitlist count if cached
      void qc.invalidateQueries({ queryKey: ["console", "waitlist"] });
    },
  });
}
