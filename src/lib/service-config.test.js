import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  isAuthConfigured,
  isCoreReady,
  isDatabaseConfigured,
  serviceReadiness,
} from "./service-config.ts";

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GIC_SERVER_SUPABASE_URL",
  "GIC_BROWSER_LOCAL_SERVICES_JSON",
  "CONSOLE_OWNER_EMAILS",
  "POSTMARK_SERVER_TOKEN",
  "POSTMARK_FROM_EMAIL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "GATEWAY_SECRET",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "XAI_API_KEY",
  "NEXUS_URL",
  "BRIDGE_URL",
];

let saved;
beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
});
afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe("serviceReadiness", () => {
  test("reports every service as not configured on an empty environment", () => {
    const readiness = serviceReadiness();
    for (const value of Object.values(readiness)) expect(value).toBe("not_configured");
    expect(isCoreReady(readiness)).toBe(false);
  });

  test("auth needs the browser keys and a server client", () => {
    process.env.SUPABASE_URL = "https://abc.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon";
    expect(isAuthConfigured()).toBe(false);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    expect(isAuthConfigured()).toBe(true);
  });

  test("database needs a server URL and the service-role key", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    expect(isDatabaseConfigured()).toBe(false);
    process.env.SUPABASE_URL = "https://abc.supabase.co";
    expect(isDatabaseConfigured()).toBe(true);
  });

  test("a whitespace-only service-role key does not count", () => {
    process.env.SUPABASE_URL = "https://abc.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "   ";
    expect(isDatabaseConfigured()).toBe(false);
  });

  test("core readiness requires auth and database", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    const readiness = serviceReadiness();
    expect(readiness.auth).toBe("configured");
    expect(readiness.database).toBe("configured");
    expect(isCoreReady(readiness)).toBe(true);
  });

  test("upstream URLs distinguish missing from invalid or insecure", () => {
    process.env.NEXUS_URL = "http://nexus.example.com";
    process.env.BRIDGE_URL = "https://bridge.example.com";
    const readiness = serviceReadiness();
    expect(readiness.nexus).toBe("invalid");
    expect(readiness.bridge).toBe("configured");
  });

  test("the AI gateway needs its secret and at least one provider key", () => {
    process.env.GATEWAY_SECRET = "s";
    expect(serviceReadiness().ai_gateway).toBe("not_configured");
    process.env.ANTHROPIC_API_KEY = "k";
    expect(serviceReadiness().ai_gateway).toBe("configured");
  });

  test("payments need both the API key and the webhook secret", () => {
    process.env.STRIPE_SECRET_KEY = "sk";
    expect(serviceReadiness().payments).toBe("not_configured");
    process.env.STRIPE_WEBHOOK_SECRET = "whsec";
    expect(serviceReadiness().payments).toBe("configured");
  });

  test("readiness never echoes values", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "super-secret-value";
    process.env.SUPABASE_URL = "https://abc.supabase.co";
    expect(JSON.stringify(serviceReadiness())).not.toContain("super-secret-value");
    expect(JSON.stringify(serviceReadiness())).not.toContain("abc.supabase.co");
  });
});
