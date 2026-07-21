/**
 * AI Gateway identifier constants.
 *
 * All names below that are not already used elsewhere in this repo are
 * marked PROPOSED — confirm before treating them as permanent contracts.
 */

/** PROPOSED: inbound auth header name (case-insensitive on read). */
export const GATEWAY_AUTH_HEADER_NAME = "X-Gateway-Secret";

/**
 * PROPOSED: server-only env var that holds the shared secret.
 * Must match the value clients send in GATEWAY_AUTH_HEADER_NAME.
 * Never use NEXT_PUBLIC_* for this.
 */
export const GATEWAY_SECRET_ENV = "GATEWAY_SECRET";

/**
 * PROPOSED: routing mode.
 * - "direct" (default): call provider HTTP APIs from this Next.js route
 * - "upstream": forward the request body to AI_GATEWAY_UPSTREAM_URL
 */
export const AI_GATEWAY_MODE_ENV = "AI_GATEWAY_MODE";

/**
 * PROPOSED: absolute URL of an upstream gateway (used when mode is "upstream").
 * Example: https://nexus-production.up.railway.app/api/gateway
 * Server-only. Distinct from NEXUS_URL (/run orchestration) and BRIDGE_URL (tools).
 */
export const AI_GATEWAY_UPSTREAM_URL_ENV = "AI_GATEWAY_UPSTREAM_URL";

/** PROPOSED: OpenAI secret (server-only). */
export const OPENAI_API_KEY_ENV = "OPENAI_API_KEY";

/** PROPOSED: Anthropic secret (server-only). */
export const ANTHROPIC_API_KEY_ENV = "ANTHROPIC_API_KEY";

/** PROPOSED: xAI / Grok secret (server-only). */
export const XAI_API_KEY_ENV = "XAI_API_KEY";

/** Canonical provider ids accepted by POST /api/gateway. */
export const SUPPORTED_PROVIDERS = ["openai", "anthropic", "xai"] as const;

export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

/** Aliases mapped to canonical provider ids (browser / legacy names). */
export const PROVIDER_ALIASES: Record<string, SupportedProvider> = {
  openai: "openai",
  anthropic: "anthropic",
  claude: "anthropic",
  xai: "xai",
  grok: "xai",
};

export const DEFAULT_MODELS: Record<SupportedProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-5-20250929",
  xai: "grok-2",
};
