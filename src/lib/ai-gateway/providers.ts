import {
  ANTHROPIC_API_KEY_ENV,
  DEFAULT_MODELS,
  OPENAI_API_KEY_ENV,
  type SupportedProvider,
  XAI_API_KEY_ENV,
} from "./constants";
import type {
  GatewayMessage,
  GatewaySuccessResponse,
  GatewayUsage,
} from "./types";

export class ProviderHttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "ProviderHttpError";
    this.status = status;
    this.code = code;
  }
}

function requireKey(envName: string): string {
  const key = process.env[envName]?.trim();
  if (!key) {
    throw new ProviderHttpError(
      `Provider not configured (${envName} missing)`,
      503,
      "provider_misconfigured",
    );
  }
  return key;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function openaiCompatibleUsage(raw: Record<string, unknown> | null): GatewayUsage | undefined {
  const usage = asRecord(raw?.usage);
  if (!usage) return undefined;
  const prompt = typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : undefined;
  const completion =
    typeof usage.completion_tokens === "number" ? usage.completion_tokens : undefined;
  const total = typeof usage.total_tokens === "number" ? usage.total_tokens : undefined;
  return {
    input_tokens: prompt,
    output_tokens: completion,
    total_tokens: total ?? (prompt !== undefined && completion !== undefined ? prompt + completion : undefined),
  };
}

async function callOpenAiCompatible(options: {
  provider: SupportedProvider;
  endpoint: string;
  apiKey: string;
  model: string;
  messages: GatewayMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<GatewaySuccessResponse> {
  const { provider, endpoint, apiKey, model, messages, temperature, maxTokens } = options;

  const body: Record<string, unknown> = {
    model,
    messages,
  };
  if (typeof temperature === "number") body.temperature = temperature;
  if (typeof maxTokens === "number") body.max_tokens = maxTokens;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ProviderHttpError("Provider unreachable", 502, "provider_unreachable");
  }

  const raw: unknown = await res.json().catch(() => ({}));
  const record = asRecord(raw);

  if (!res.ok) {
    // Never surface provider bodies that might echo secrets; keep message generic.
    throw new ProviderHttpError(
      `Provider error (${provider})`,
      res.status >= 400 && res.status < 600 ? res.status : 502,
      "provider_error",
    );
  }

  const choices = Array.isArray(record?.choices) ? record.choices : [];
  const first = asRecord(choices[0]);
  const message = asRecord(first?.message);
  const content = message?.content;
  const output_text = typeof content === "string" ? content : "";

  return {
    id: typeof record?.id === "string" ? record.id : crypto.randomUUID(),
    provider,
    model,
    output_text,
    usage: openaiCompatibleUsage(record),
    raw,
  };
}

async function callAnthropic(options: {
  model: string;
  messages: GatewayMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<GatewaySuccessResponse> {
  const apiKey = requireKey(ANTHROPIC_API_KEY_ENV);
  const { model, messages, temperature, maxTokens } = options;

  const systemParts = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .filter(Boolean);
  const chatMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  if (chatMessages.length === 0) {
    throw new ProviderHttpError("messages must include at least one user turn", 400, "invalid_request");
  }

  const body: Record<string, unknown> = {
    model,
    max_tokens: typeof maxTokens === "number" ? maxTokens : 1024,
    messages: chatMessages,
  };
  if (systemParts.length > 0) body.system = systemParts.join("\n\n");
  if (typeof temperature === "number") body.temperature = temperature;

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ProviderHttpError("Provider unreachable", 502, "provider_unreachable");
  }

  const raw: unknown = await res.json().catch(() => ({}));
  const record = asRecord(raw);

  if (!res.ok) {
    throw new ProviderHttpError(
      "Provider error (anthropic)",
      res.status >= 400 && res.status < 600 ? res.status : 502,
      "provider_error",
    );
  }

  const contentBlocks = Array.isArray(record?.content) ? record.content : [];
  const texts: string[] = [];
  for (const block of contentBlocks) {
    const b = asRecord(block);
    if (b?.type === "text" && typeof b.text === "string") texts.push(b.text);
  }

  const usageRaw = asRecord(record?.usage);
  const usage: GatewayUsage | undefined = usageRaw
    ? {
        input_tokens:
          typeof usageRaw.input_tokens === "number" ? usageRaw.input_tokens : undefined,
        output_tokens:
          typeof usageRaw.output_tokens === "number" ? usageRaw.output_tokens : undefined,
        total_tokens:
          typeof usageRaw.input_tokens === "number" && typeof usageRaw.output_tokens === "number"
            ? usageRaw.input_tokens + usageRaw.output_tokens
            : undefined,
      }
    : undefined;

  return {
    id: typeof record?.id === "string" ? record.id : crypto.randomUUID(),
    provider: "anthropic",
    model: typeof record?.model === "string" ? record.model : model,
    output_text: texts.join(""),
    usage,
    raw,
  };
}

export async function callProviderDirect(options: {
  provider: SupportedProvider;
  model?: string;
  messages: GatewayMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<GatewaySuccessResponse> {
  const model = options.model?.trim() || DEFAULT_MODELS[options.provider];
  const { messages, temperature, maxTokens } = options;

  switch (options.provider) {
    case "openai":
      return callOpenAiCompatible({
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        apiKey: requireKey(OPENAI_API_KEY_ENV),
        model,
        messages,
        temperature,
        maxTokens,
      });
    case "xai":
      return callOpenAiCompatible({
        provider: "xai",
        endpoint: "https://api.x.ai/v1/chat/completions",
        apiKey: requireKey(XAI_API_KEY_ENV),
        model,
        messages,
        temperature,
        maxTokens,
      });
    case "anthropic":
      return callAnthropic({ model, messages, temperature, maxTokens });
    default: {
      const _exhaustive: never = options.provider;
      throw new ProviderHttpError(`Unsupported provider: ${String(_exhaustive)}`, 400, "unsupported_provider");
    }
  }
}
