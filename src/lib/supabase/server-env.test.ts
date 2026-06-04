import { afterEach, beforeEach, describe, expect, test } from "bun:test";

// Snapshot of env vars we touch so we can restore them
const ENV_KEYS = [
  "SUPABASE_URL",
  "GIC_SERVER_SUPABASE_URL",
  "GIC_BROWSER_LOCAL_SERVICES_JSON",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

type EnvSnapshot = Partial<Record<(typeof ENV_KEYS)[number], string>>;

let savedEnv: EnvSnapshot = {};

beforeEach(() => {
  // Save and clear all relevant env vars
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  // Restore original values
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
  savedEnv = {};
});

// Dynamic import so env manipulation in beforeEach takes effect per test.
// The functions read process.env at call-time, so a single import is fine.
const { tryGetSupabaseServerEnv, getSupabaseServerEnv } = await import(
  "./server-env"
);

// ---------------------------------------------------------------------------
// tryGetSupabaseServerEnv
// ---------------------------------------------------------------------------

describe("tryGetSupabaseServerEnv", () => {
  test("returns null when no env vars are set", () => {
    expect(tryGetSupabaseServerEnv()).toBeNull();
  });

  test("returns null when only URL is set (missing anon key)", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    expect(tryGetSupabaseServerEnv()).toBeNull();
  });

  test("returns null when only anon key is set (missing URL)", () => {
    process.env.SUPABASE_ANON_KEY = "anon-key-value";
    expect(tryGetSupabaseServerEnv()).toBeNull();
  });

  test("returns env object when NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY are set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key-value";

    const result = tryGetSupabaseServerEnv();
    expect(result).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon-key-value",
    });
  });

  test("returns env object when NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";

    const result = tryGetSupabaseServerEnv();
    expect(result).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "public-anon-key",
    });
  });

  test("SUPABASE_ANON_KEY takes precedence over NEXT_PUBLIC_SUPABASE_ANON_KEY", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "server-anon-key";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";

    const result = tryGetSupabaseServerEnv();
    expect(result?.supabaseAnonKey).toBe("server-anon-key");
  });

  test("SUPABASE_URL takes precedence over NEXT_PUBLIC_SUPABASE_URL", () => {
    process.env.SUPABASE_URL = "https://server.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key-value";

    const result = tryGetSupabaseServerEnv();
    expect(result?.supabaseUrl).toBe("https://server.supabase.co");
  });

  test("GIC_SERVER_SUPABASE_URL takes precedence over SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL", () => {
    process.env.GIC_SERVER_SUPABASE_URL = "https://gic-server.supabase.co";
    process.env.SUPABASE_URL = "https://server.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key-value";

    const result = tryGetSupabaseServerEnv();
    expect(result?.supabaseUrl).toBe("https://gic-server.supabase.co");
  });

  test("returns env object using only SUPABASE_URL and SUPABASE_ANON_KEY", () => {
    process.env.SUPABASE_URL = "https://server.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key-value";

    const result = tryGetSupabaseServerEnv();
    expect(result).toEqual({
      supabaseUrl: "https://server.supabase.co",
      supabaseAnonKey: "anon-key-value",
    });
  });

  test("skips SUPABASE_URL that looks like a browser-service proxy URL", () => {
    // A browser-service proxy URL contains /proxy/browser/service/ in its path,
    // which indicates it's not suitable as a server-side URL.
    process.env.SUPABASE_URL =
      "https://sandbox.example.com/proxy/browser/service/supabase";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key-value";

    const result = tryGetSupabaseServerEnv();
    // Should fall back to NEXT_PUBLIC_SUPABASE_URL
    expect(result?.supabaseUrl).toBe("https://public.supabase.co");
  });

  test("returns null when SUPABASE_URL is a browser-service proxy URL and no NEXT_PUBLIC_SUPABASE_URL", () => {
    process.env.SUPABASE_URL =
      "https://sandbox.example.com/proxy/browser/service/supabase";
    process.env.SUPABASE_ANON_KEY = "anon-key-value";

    expect(tryGetSupabaseServerEnv()).toBeNull();
  });

  test("resolves URL from GIC_BROWSER_LOCAL_SERVICES_JSON when supabase service present", () => {
    process.env.GIC_BROWSER_LOCAL_SERVICES_JSON = JSON.stringify([
      { alias: "supabase", port: 54321, scheme: "http" },
    ]);
    process.env.SUPABASE_ANON_KEY = "anon-key-value";

    const result = tryGetSupabaseServerEnv();
    expect(result?.supabaseUrl).toBe("http://127.0.0.1:54321");
  });

  test("resolves https URL from GIC_BROWSER_LOCAL_SERVICES_JSON when scheme is https", () => {
    process.env.GIC_BROWSER_LOCAL_SERVICES_JSON = JSON.stringify([
      { alias: "supabase", port: 54321, scheme: "https" },
    ]);
    process.env.SUPABASE_ANON_KEY = "anon-key-value";

    const result = tryGetSupabaseServerEnv();
    expect(result?.supabaseUrl).toBe("https://127.0.0.1:54321");
  });

  test("ignores non-supabase services in GIC_BROWSER_LOCAL_SERVICES_JSON", () => {
    process.env.GIC_BROWSER_LOCAL_SERVICES_JSON = JSON.stringify([
      { alias: "postgres", port: 5432, scheme: "http" },
      { alias: "redis", port: 6379, scheme: "http" },
    ]);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key-value";

    const result = tryGetSupabaseServerEnv();
    // Falls through to NEXT_PUBLIC_SUPABASE_URL since no supabase alias found
    expect(result?.supabaseUrl).toBe("https://public.supabase.co");
  });

  test("returns null for malformed GIC_BROWSER_LOCAL_SERVICES_JSON and no other URL", () => {
    process.env.GIC_BROWSER_LOCAL_SERVICES_JSON = "not-valid-json";
    process.env.SUPABASE_ANON_KEY = "anon-key-value";

    expect(tryGetSupabaseServerEnv()).toBeNull();
  });

  test("returned object conforms to SupabaseServerEnv interface shape", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key-value";

    const result = tryGetSupabaseServerEnv();
    expect(result).not.toBeNull();
    expect(typeof result?.supabaseUrl).toBe("string");
    expect(typeof result?.supabaseAnonKey).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// getSupabaseServerEnv
// ---------------------------------------------------------------------------

describe("getSupabaseServerEnv", () => {
  test("throws when no env vars are set", () => {
    expect(() => getSupabaseServerEnv()).toThrow();
  });

  test("throws error mentioning missing env when URL is absent", () => {
    process.env.SUPABASE_ANON_KEY = "anon-key-value";
    expect(() => getSupabaseServerEnv()).toThrow(/Missing Supabase server env/);
  });

  test("throws error mentioning missing env when anon key is absent", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    expect(() => getSupabaseServerEnv()).toThrow(/Missing Supabase server env/);
  });

  test("returns env object when both URL and anon key are set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key-value";

    const result = getSupabaseServerEnv();
    expect(result).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon-key-value",
    });
  });

  test("returns the same result as tryGetSupabaseServerEnv when env is valid", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key-value";

    const tryResult = tryGetSupabaseServerEnv();
    const getResult = getSupabaseServerEnv();
    expect(getResult).toEqual(tryResult);
  });

  test("does not throw when all required env vars are present", () => {
    process.env.SUPABASE_URL = "https://server.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key-value";

    expect(() => getSupabaseServerEnv()).not.toThrow();
  });
});
