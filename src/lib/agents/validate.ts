/**
 * Boundary validation for the /api/agents route family. The database has
 * only a status check constraint, so lengths, formats, and types are
 * enforced here before anything reaches Supabase.
 */

export const AGENT_LIMITS = {
  name: 120,
  description: 500,
  systemPrompt: 20_000,
  model: 100,
  tools: 32,
  input: 16_000,
} as const;

export const AGENT_STATUSES = ["draft", "active", "archived"] as const;
export type AgentStatus = (typeof AGENT_STATUSES)[number];

const TOOL_NAME = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/;
const MODEL_ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,99}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for control characters other than tab, newline, and carriage return. */
function hasControlChars(text: string): boolean {
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    const isAllowedWhitespace = code === 9 || code === 10 || code === 13;
    if ((code < 32 && !isAllowedWhitespace) || code === 127) return true;
  }
  return false;
}

export type AgentCreateInput = {
  name: string;
  description: string | null;
  system_prompt: string;
  model: string;
  tools: string[];
};

export type AgentPatchInput = Partial<AgentCreateInput & { status: AgentStatus }>;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; field: string };

function fail<T>(field: string, error: string): ValidationResult<T> {
  return { ok: false, field, error };
}

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

function readName(raw: unknown): ValidationResult<string> {
  if (typeof raw !== "string") return fail("name", "name must be a string");
  const name = raw.trim();
  if (!name) return fail("name", "name is required");
  if (name.length > AGENT_LIMITS.name) return fail("name", `name must be at most ${AGENT_LIMITS.name} characters`);
  if (hasControlChars(name) || /[\r\n\t]/.test(name)) return fail("name", "name must be a single line of text");
  return { ok: true, value: name };
}

function readDescription(raw: unknown): ValidationResult<string | null> {
  if (raw === null || raw === undefined) return { ok: true, value: null };
  if (typeof raw !== "string") return fail("description", "description must be a string");
  const description = raw.trim();
  if (description.length > AGENT_LIMITS.description) {
    return fail("description", `description must be at most ${AGENT_LIMITS.description} characters`);
  }
  if (hasControlChars(description)) return fail("description", "description contains control characters");
  return { ok: true, value: description || null };
}

function readSystemPrompt(raw: unknown): ValidationResult<string> {
  if (raw === null || raw === undefined) return { ok: true, value: "" };
  if (typeof raw !== "string") return fail("system_prompt", "system_prompt must be a string");
  if (raw.length > AGENT_LIMITS.systemPrompt) {
    return fail("system_prompt", `system_prompt must be at most ${AGENT_LIMITS.systemPrompt} characters`);
  }
  if (hasControlChars(raw)) return fail("system_prompt", "system_prompt contains control characters");
  return { ok: true, value: raw };
}

function readModel(raw: unknown): ValidationResult<string> {
  if (typeof raw !== "string") return fail("model", "model must be a string");
  const model = raw.trim();
  if (!MODEL_ID.test(model)) return fail("model", "model must be a model identifier such as openai/gpt-4o-mini");
  return { ok: true, value: model };
}

export function readTools(raw: unknown): ValidationResult<string[]> {
  if (raw === null || raw === undefined) return { ok: true, value: [] };
  if (!Array.isArray(raw)) return fail("tools", "tools must be an array of tool names");
  if (raw.length > AGENT_LIMITS.tools) return fail("tools", `at most ${AGENT_LIMITS.tools} tools`);
  const tools: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !TOOL_NAME.test(item.trim())) {
      return fail("tools", "each tool must be a registered tool name (letters, digits, . _ : -)");
    }
    const name = item.trim();
    if (!tools.includes(name)) tools.push(name);
  }
  return { ok: true, value: tools };
}

function asObject(body: unknown): Record<string, unknown> | null {
  return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
}

export function validateAgentCreate(body: unknown, defaultModel: string): ValidationResult<AgentCreateInput> {
  const obj = asObject(body);
  if (!obj) return fail("body", "Request body must be a JSON object");

  const name = readName(obj.name);
  if (!name.ok) return name;
  const description = readDescription(obj.description);
  if (!description.ok) return description;
  const systemPrompt = readSystemPrompt(obj.system_prompt);
  if (!systemPrompt.ok) return systemPrompt;
  const model = obj.model === undefined || obj.model === "" ? { ok: true as const, value: defaultModel } : readModel(obj.model);
  if (!model.ok) return model;
  const tools = readTools(obj.tools);
  if (!tools.ok) return tools;

  return {
    ok: true,
    value: {
      name: name.value,
      description: description.value,
      system_prompt: systemPrompt.value,
      model: model.value,
      tools: tools.value,
    },
  };
}

export function validateAgentPatch(body: unknown): ValidationResult<AgentPatchInput> {
  const obj = asObject(body);
  if (!obj) return fail("body", "Request body must be a JSON object");
  const patch: AgentPatchInput = {};

  if (obj.name !== undefined) {
    const name = readName(obj.name);
    if (!name.ok) return name;
    patch.name = name.value;
  }
  if (obj.description !== undefined) {
    const description = readDescription(obj.description);
    if (!description.ok) return description;
    patch.description = description.value;
  }
  if (obj.system_prompt !== undefined) {
    const systemPrompt = readSystemPrompt(obj.system_prompt);
    if (!systemPrompt.ok) return systemPrompt;
    patch.system_prompt = systemPrompt.value;
  }
  if (obj.model !== undefined) {
    const model = readModel(obj.model);
    if (!model.ok) return model;
    patch.model = model.value;
  }
  if (obj.tools !== undefined) {
    const tools = readTools(obj.tools);
    if (!tools.ok) return tools;
    patch.tools = tools.value;
  }
  if (obj.status !== undefined) {
    if (typeof obj.status !== "string" || !(AGENT_STATUSES as readonly string[]).includes(obj.status)) {
      return fail("status", "status must be draft, active, or archived");
    }
    patch.status = obj.status as AgentStatus;
  }
  return { ok: true, value: patch };
}

export function validateCloneName(raw: unknown, fallback: string): ValidationResult<string> {
  if (raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "")) {
    return readName(fallback.slice(0, AGENT_LIMITS.name));
  }
  return readName(raw);
}

export function validateRunInput(raw: unknown): ValidationResult<string> {
  if (typeof raw !== "string") return fail("input", "input must be a string");
  const input = raw.trim();
  if (!input) return fail("input", "input is required");
  if (input.length > AGENT_LIMITS.input) return fail("input", `input must be at most ${AGENT_LIMITS.input} characters`);
  return { ok: true, value: input };
}

/** Parse a bounded integer query parameter; invalid values fall back. */
export function parseBoundedInt(raw: string | null, fallback: number, min: number, max: number): number {
  if (raw === null || raw.trim() === "") return fallback;
  if (!/^\d+$/.test(raw.trim())) return fallback;
  const n = Number(raw);
  if (!Number.isSafeInteger(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}
