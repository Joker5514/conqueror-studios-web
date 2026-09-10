import type { SupportedProvider } from "./constants";

export interface GatewayMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Minimal POST body for /api/gateway.
 * Only documented fields are used; upstream mode forwards an allowlisted subset.
 */
export interface GatewayRequestBody {
  provider: string;
  model?: string;
  /** Chat-style messages (preferred). */
  messages?: GatewayMessage[];
  /** Convenience single-turn prompt when messages is omitted. */
  input?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface GatewayUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
}

export interface GatewaySuccessResponse {
  id: string;
  provider: SupportedProvider;
  model: string;
  output_text: string;
  usage?: GatewayUsage;
}

export interface GatewayErrorResponse {
  error: string;
  code?: string;
}
