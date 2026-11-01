/**
 * Structured JSON logging for server code. Every line is one JSON object so
 * Vercel runtime logs can be filtered by `event`, `correlation_id`, or
 * `trace_id`. Values are redacted before they are written: keys that look like
 * credentials are replaced, email addresses are masked, and token-shaped
 * strings are removed.
 */

type Level = "debug" | "info" | "warn" | "error";

const SENSITIVE_KEY =
  /(secret|token|password|passwd|authorization|cookie|api[-_]?key|service[-_]?role|signature|bearer|credential)/i;
const EMAIL = /[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})/gi;
const TOKEN_SHAPES: RegExp[] = [
  /\b(sk|rk|pk)_(live|test)_[A-Za-z0-9]{8,}\b/g,
  /\bwhsec_[A-Za-z0-9]{8,}\b/g,
  /\bsk-(proj-|ant-)?[A-Za-z0-9_-]{16,}\b/g,
  /\bxai-[A-Za-z0-9]{16,}\b/g,
  /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{16,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  /\bsb_(secret|publishable)_[A-Za-z0-9_-]{10,}\b/g,
];
const MAX_STRING = 500;
const MAX_ITEMS = 20;
const MAX_DEPTH = 4;

export function redactString(value: string): string {
  let out = value.replace(EMAIL, (_match, domain: string) => `***@${domain}`);
  for (const pattern of TOKEN_SHAPES) out = out.replace(pattern, "[redacted]");
  return out.length > MAX_STRING ? `${out.slice(0, MAX_STRING)}…` : out;
}

export function sanitize(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Error) {
    const withCode = value as Error & { code?: unknown; status?: unknown };
    return {
      name: value.name,
      message: redactString(value.message),
      ...(withCode.code !== undefined ? { code: sanitize(withCode.code, depth + 1) } : {}),
      ...(withCode.status !== undefined ? { status: sanitize(withCode.status, depth + 1) } : {}),
    };
  }
  if (depth >= MAX_DEPTH) return "[truncated]";
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ITEMS).map((item) => sanitize(item, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>).slice(0, 50)) {
      out[key] = SENSITIVE_KEY.test(key) ? "[redacted]" : sanitize(entry, depth + 1);
    }
    return out;
  }
  return String(value);
}

function write(level: Level, event: string, fields?: Record<string, unknown>): void {
  const line = JSON.stringify({
    level,
    event,
    ts: new Date().toISOString(),
    ...(fields ? (sanitize(fields) as Record<string, unknown>) : {}),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (event: string, fields?: Record<string, unknown>) => {
    if (process.env.LOG_LEVEL === "debug") write("debug", event, fields);
  },
  info: (event: string, fields?: Record<string, unknown>) => write("info", event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => write("warn", event, fields),
  error: (event: string, fields?: Record<string, unknown>) => write("error", event, fields),
};
