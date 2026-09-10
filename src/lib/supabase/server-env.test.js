import { afterEach, beforeEach, expect, test } from "bun:test";

// Capture original env values so we can restore after each test
let savedEnv;

beforeEach(() => {
  savedEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    GIC_SERVER_SUPABASE_URL: process.env.GIC_SERVER_SUPABASE_URL,
    GIC_BROWSER_LOCAL_SERVICES_JSON: process.env.GIC_BROWSER_LOCAL_SERVICES_JSON,
  };
  // Clear all relevant env vars before each test
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.GIC_SERVER_SUPABASE_URL;
  delete process.env.GIC_BROWSER_LOCAL_SERVICES_JSON;
});

afterEach(() => {
  // Restore all env vars
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

// Import once. server-env.ts reads process.env inside function bodies
// (not at module load time). Do not mock this module from sibling test files.
const { tryGetSupabaseServerEnv, getSupabaseServerEnv } = await import(
  "./server-env"
);

// ─── tryGetSupabaseServerEnv ────────────────────────────────────────────────

test("tryGetSupabaseServerEnv returns null when no env vars are set", () => {
  const result = tryGetSupabaseServerEnv();
  expect(result).toBeNull();
});

test("tryGetSupabaseServerEnv returns null when URL is missing but anon key is present", () => {
  process.env.SUPABASE_ANON_KEY = "anon-key";

  const result = tryGetSupabaseServerEnv();
  expect(result).toBeNull();
});

test("tryGetSupabaseServerEnv returns null when anon key is missing but URL is present", () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";

  const result = tryGetSupabaseServerEnv();
  expect(result).toBeNull();
});

test("tryGetSupabaseServerEnv returns env object with SUPABASE_URL and SUPABASE_ANON_KEY", () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_ANON_KEY = "my-anon-key";

  const result = tryGetSupabaseServerEnv();
  expect(result).toEqual({
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "my-anon-key",
  });
});

test("tryGetSupabaseServerEnv uses NEXT_PUBLIC_SUPABASE_ANON_KEY when SUPABASE_ANON_KEY is absent", () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";

  const result = tryGetSupabaseServerEnv();
  expect(result).toEqual({
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "public-anon-key",
  });
});

test("tryGetSupabaseServerEnv prefers SUPABASE_ANON_KEY over NEXT_PUBLIC_SUPABASE_ANON_KEY", () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_ANON_KEY = "server-anon-key";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";

  const result = tryGetSupabaseServerEnv();
  expect(result).not.toBeNull();
  expect(result.supabaseAnonKey).toBe("server-anon-key");
});

test("tryGetSupabaseServerEnv prefers GIC_SERVER_SUPABASE_URL over SUPABASE_URL", () => {
  process.env.SUPABASE_URL = "https://original.supabase.co";
  process.env.GIC_SERVER_SUPABASE_URL = "https://sandbox.supabase.co";
  process.env.SUPABASE_ANON_KEY = "anon-key";

  const result = tryGetSupabaseServerEnv();
  expect(result).not.toBeNull();
  expect(result.supabaseUrl).toBe("https://sandbox.supabase.co");
});

test("tryGetSupabaseServerEnv falls back to NEXT_PUBLIC_SUPABASE_URL when no server URL is set", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.supabase.co";
  process.env.SUPABASE_ANON_KEY = "anon-key";

  const result = tryGetSupabaseServerEnv();
  expect(result).toEqual({
    supabaseUrl: "https://public.supabase.co",
    supabaseAnonKey: "anon-key",
  });
});

test("tryGetSupabaseServerEnv returns null when SUPABASE_URL is a browser service proxy URL and no fallback is set", () => {
  process.env.SUPABASE_URL =
    "https://example.com/proxy/browser/service/supabase";
  process.env.SUPABASE_ANON_KEY = "anon-key";

  const result = tryGetSupabaseServerEnv();
  expect(result).toBeNull();
});

test("tryGetSupabaseServerEnv uses NEXT_PUBLIC_SUPABASE_URL when SUPABASE_URL is a browser service proxy URL", () => {
  process.env.SUPABASE_URL =
    "https://example.com/proxy/browser/service/supabase";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://real.supabase.co";
  process.env.SUPABASE_ANON_KEY = "anon-key";

  const result = tryGetSupabaseServerEnv();
  expect(result).not.toBeNull();
  expect(result.supabaseUrl).toBe("https://real.supabase.co");
});

test("tryGetSupabaseServerEnv uses GIC_BROWSER_LOCAL_SERVICES_JSON sandbox URL when present", () => {
  const localServices = JSON.stringify([
    { alias: "supabase", port: 54321, scheme: "http" },
  ]);
  process.env.GIC_BROWSER_LOCAL_SERVICES_JSON = localServices;
  process.env.SUPABASE_ANON_KEY = "anon-key";

  const result = tryGetSupabaseServerEnv();
  expect(result).not.toBeNull();
  expect(result.supabaseUrl).toBe("http://127.0.0.1:54321");
});

// ─── getSupabaseServerEnv ────────────────────────────────────────────────────

test("getSupabaseServerEnv throws when no env vars are configured", () => {
  expect(() => getSupabaseServerEnv()).toThrow(
    "Missing Supabase server env. Set SUPABASE_URL, GIC_SERVER_SUPABASE_URL, or NEXT_PUBLIC_SUPABASE_URL with SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
});

test("getSupabaseServerEnv throws when URL is set but anon key is missing", () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";

  expect(() => getSupabaseServerEnv()).toThrow(
    "Missing Supabase server env."
  );
});

test("getSupabaseServerEnv returns the env object when both URL and key are configured", () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_ANON_KEY = "my-anon-key";

  const result = getSupabaseServerEnv();
  expect(result).toEqual({
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "my-anon-key",
  });
});

test("getSupabaseServerEnv does not throw and returns correct env when NEXT_PUBLIC_SUPABASE_ANON_KEY is used", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";

  const result = getSupabaseServerEnv();
  expect(result).toEqual({
    supabaseUrl: "https://public.supabase.co",
    supabaseAnonKey: "public-anon-key",
  });
});

// Regression: getSupabaseServerEnv must delegate to tryGetSupabaseServerEnv rather than
// duplicating logic, so it respects the GIC_SERVER_SUPABASE_URL priority.
test("getSupabaseServerEnv delegates URL priority to tryGetSupabaseServerEnv (GIC_SERVER_SUPABASE_URL wins)", () => {
  process.env.SUPABASE_URL = "https://original.supabase.co";
  process.env.GIC_SERVER_SUPABASE_URL = "https://sandbox.supabase.co";
  process.env.SUPABASE_ANON_KEY = "anon-key";

  const result = getSupabaseServerEnv();
  expect(result.supabaseUrl).toBe("https://sandbox.supabase.co");
});
