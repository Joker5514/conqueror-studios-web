import { beforeEach, expect, mock, test } from "bun:test";

// ─── Mock state ─────────────────────────────────────────────────────────────

// Mutable variables captured by mock closures so individual tests can control
// what the mocked modules return.

let mockServerEnv = null;
let getUserCalls = [];
let createServerClientCalls = [];
let setCookieCalls = [];

// ─── Module mocks ────────────────────────────────────────────────────────────

mock.module("./server-env", () => ({
  tryGetSupabaseServerEnv: () => mockServerEnv,
}));

// Track NextResponse.next calls and provide a minimal cookie-aware response.
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

let nextResponseNextCalls = [];

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

    // Expose the cookies.setAll hook so tests can exercise it
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
  // Minimal NextRequest-like object used by updateSession
  const cookieStore = new Map();
  return {
    url: `http://localhost${pathname}`,
    cookies: {
      getAll: () => [...cookieStore.entries()].map(([name, value]) => ({ name, value })),
    },
  };
}

beforeEach(() => {
  mockServerEnv = null;
  getUserCalls = [];
  createServerClientCalls = [];
  setCookieCalls = [];
  nextResponseNextCalls = [];
});

// ─── Tests ───────────────────────────────────────────────────────────────────

test("returns NextResponse.next when Supabase is not configured (serverEnv is null)", async () => {
  mockServerEnv = null;
  const request = makeRequest();

  const response = await updateSession(request);

  // Should return a pass-through response without calling createServerClient
  expect(response).not.toBeNull();
  expect(nextResponseNextCalls).toHaveLength(1);
  expect(nextResponseNextCalls[0]).toEqual({ request });
  expect(createServerClientCalls).toHaveLength(0);
  expect(getUserCalls).toHaveLength(0);
});

test("calls createServerClient with the URL and anonKey from serverEnv when configured", async () => {
  mockServerEnv = {
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "my-anon-key",
  };
  const request = makeRequest();

  await updateSession(request);

  expect(createServerClientCalls).toHaveLength(1);
  expect(createServerClientCalls[0].url).toBe("https://example.supabase.co");
  expect(createServerClientCalls[0].anonKey).toBe("my-anon-key");
});

test("calls supabase.auth.getUser() to refresh the session when configured", async () => {
  mockServerEnv = {
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "my-anon-key",
  };
  const request = makeRequest();

  await updateSession(request);

  expect(getUserCalls).toHaveLength(1);
});

test("returns a response (not null) when Supabase is configured", async () => {
  mockServerEnv = {
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "my-anon-key",
  };
  const request = makeRequest();

  const response = await updateSession(request);

  expect(response).not.toBeNull();
});

test("passes request cookies to createServerClient via getAll", async () => {
  mockServerEnv = {
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "my-anon-key",
  };

  // Create a request that has a cookie
  const cookieStore = new Map([["sb-token", "abc123"]]);
  const request = {
    url: "http://localhost/",
    cookies: {
      getAll: () =>
        [...cookieStore.entries()].map(([name, value]) => ({ name, value })),
    },
  };

  await updateSession(request);

  // The createServerClient options.cookies.getAll must return the request cookies
  expect(createServerClientCalls).toHaveLength(1);
  const { options } = createServerClientCalls[0];
  const cookies = options.cookies.getAll();
  expect(cookies).toEqual([{ name: "sb-token", value: "abc123" }]);
});

test("provides both getAll and setAll cookie handlers to createServerClient", async () => {
  mockServerEnv = {
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "my-anon-key",
  };
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
  mockServerEnv = null;

  const paths = ["/", "/dashboard", "/api/data", "/auth/callback"];

  for (const path of paths) {
    const response = await updateSession(makeRequest(path));
    expect(response).not.toBeNull();
  }

  expect(createServerClientCalls).toHaveLength(0);
  expect(getUserCalls).toHaveLength(0);
});