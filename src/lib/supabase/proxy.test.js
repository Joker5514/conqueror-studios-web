import { afterEach, beforeEach, expect, mock, test } from "bun:test";

// ─── Mock state ─────────────────────────────────────────────────────────────

let getUserCalls = [];
let createServerClientCalls = [];
let setCookieCalls = [];
let nextResponseNextCalls = [];

// Env snapshot so we can drive tryGetSupabaseServerEnv via real process.env
// (avoids mock.module("./server-env"), which leaks into sibling test files).
let savedEnv;

// ─── Module mocks (external packages only) ───────────────────────────────────

const makeNextResponse = (request) => {
  const cookies = new Map();
  return {
    _request: request,
    cookies: {
      set(name, value, options) {
        setCookieCalls.push({ name, value, options });
        cookies.set(name, value);
      },
      get(name) {
        return cookies.get(name);
      },
    },
  };
};

mock.module("next/server", () => ({
  NextResponse: {
    next: (init) => {
      const response = makeNextResponse(init?.request);
      nextResponseNextCalls.push(init);
      return response;
    },
  },
}));

mock.module("@supabase/ssr", () => ({
  createServerClient: (url, anonKey, options) => {
    createServerClientCalls.push({ url, anonKey, options });

    const setAll = options?.cookies?.setAll;

    return {
      _setAll: setAll,
      auth: {
        getUser: async () => {
          getUserCalls.push(true);
          return { data: { user: null }, error: null };
        },
      },
    };
  },
}));

// ─── Import the module under test AFTER mocks are registered ─────────────────

const { updateSession } = await import("./proxy");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(pathname = "/") {
  const cookieStore = new Map();
  return {
    url: `http://localhost${pathname}`,
    cookies: {
      getAll: () =>
        [...cookieStore.entries()].map(([name, value]) => ({ name, value })),
    },
  };
}

function clearSupabaseEnv() {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.GIC_SERVER_SUPABASE_URL;
  delete process.env.GIC_BROWSER_LOCAL_SERVICES_JSON;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function configureSupabaseEnv(
  url = "https://example.supabase.co",
  anonKey = "my-anon-key",
) {
  process.env.SUPABASE_URL = url;
  process.env.SUPABASE_ANON_KEY = anonKey;
}

beforeEach(() => {
  savedEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    GIC_SERVER_SUPABASE_URL: process.env.GIC_SERVER_SUPABASE_URL,
    GIC_BROWSER_LOCAL_SERVICES_JSON: process.env.GIC_BROWSER_LOCAL_SERVICES_JSON,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  clearSupabaseEnv();
  getUserCalls = [];
  createServerClientCalls = [];
  setCookieCalls = [];
  nextResponseNextCalls = [];
});

afterEach(() => {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

// ─── Tests ───────────────────────────────────────────────────────────────────

test("returns NextResponse.next when Supabase is not configured (serverEnv is null)", async () => {
  const request = makeRequest();

  const response = await updateSession(request);

  expect(response).not.toBeNull();
  expect(nextResponseNextCalls).toHaveLength(1);
  expect(nextResponseNextCalls[0]).toEqual({ request });
  expect(createServerClientCalls).toHaveLength(0);
  expect(getUserCalls).toHaveLength(0);
});

test("calls createServerClient with the URL and anonKey from serverEnv when configured", async () => {
  configureSupabaseEnv("https://example.supabase.co", "my-anon-key");
  const request = makeRequest();

  await updateSession(request);

  expect(createServerClientCalls).toHaveLength(1);
  expect(createServerClientCalls[0].url).toBe("https://example.supabase.co");
  expect(createServerClientCalls[0].anonKey).toBe("my-anon-key");
});

test("calls supabase.auth.getUser() to refresh the session when configured", async () => {
  configureSupabaseEnv();
  const request = makeRequest();

  await updateSession(request);

  expect(getUserCalls).toHaveLength(1);
});

test("returns a response (not null) when Supabase is configured", async () => {
  configureSupabaseEnv();
  const request = makeRequest();

  const response = await updateSession(request);

  expect(response).not.toBeNull();
});

test("passes request cookies to createServerClient via getAll", async () => {
  configureSupabaseEnv();

  const cookieStore = new Map([["sb-token", "abc123"]]);
  const request = {
    url: "http://localhost/",
    cookies: {
      getAll: () =>
        [...cookieStore.entries()].map(([name, value]) => ({ name, value })),
    },
  };

  await updateSession(request);

  expect(createServerClientCalls).toHaveLength(1);
  const { options } = createServerClientCalls[0];
  const cookies = options.cookies.getAll();
  expect(cookies).toEqual([{ name: "sb-token", value: "abc123" }]);
});

test("provides both getAll and setAll cookie handlers to createServerClient", async () => {
  configureSupabaseEnv();
  const request = makeRequest();

  await updateSession(request);

  expect(createServerClientCalls).toHaveLength(1);
  const { options } = createServerClientCalls[0];
  expect(typeof options.cookies.getAll).toBe("function");
  expect(typeof options.cookies.setAll).toBe("function");
});

// Regression: when serverEnv is null, no session refresh should happen regardless
// of the request path, confirming the early-return guard works for all routes.
test("skips session refresh for any request path when Supabase is not configured", async () => {
  const paths = ["/", "/dashboard", "/api/data", "/auth/callback"];

  for (const path of paths) {
    const response = await updateSession(makeRequest(path));
    expect(response).not.toBeNull();
  }

  expect(createServerClientCalls).toHaveLength(0);
  expect(getUserCalls).toHaveLength(0);
});
