import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { SupabaseServerEnv } from "./server-env";

// ---------------------------------------------------------------------------
// Mutable state that test cases can reconfigure before each assertion
// ---------------------------------------------------------------------------

let mockServerEnv: SupabaseServerEnv | null = null;

const mockGetUserFn = mock(async () => ({ data: { user: null }, error: null }));
const mockCreateServerClientFn = mock(() => ({
  auth: { getUser: mockGetUserFn },
}));

// Track NextResponse.next calls so we can assert on them
const nextResponseNextCalls: Array<{ request?: unknown }> = [];
const mockNextResponseNext = mock((options?: { request?: unknown }) => {
  nextResponseNextCalls.push({ request: options?.request });
  return {
    cookies: {
      set: mock(() => {}),
    },
    _isMockResponse: true,
    _options: options,
  };
});

// ---------------------------------------------------------------------------
// Module mocks – must be declared before dynamic import
// ---------------------------------------------------------------------------

mock.module("./server-env", () => ({
  tryGetSupabaseServerEnv: () => mockServerEnv,
}));

mock.module("@supabase/ssr", () => ({
  createServerClient: mockCreateServerClientFn,
}));

mock.module("next/server", () => ({
  NextResponse: {
    next: mockNextResponseNext,
  },
}));

// Dynamic import after all mocks are in place
const { updateSession } = await import("./proxy");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockRequest(cookieEntries: Array<{ name: string; value: string }> = []) {
  return {
    cookies: {
      getAll: () => cookieEntries,
    },
  } as unknown as import("next/server").NextRequest;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockServerEnv = null;
  nextResponseNextCalls.length = 0;
  mockCreateServerClientFn.mockClear();
  mockGetUserFn.mockClear();
  mockNextResponseNext.mockClear();
});

describe("updateSession – Supabase not configured", () => {
  test("returns NextResponse.next with the original request when serverEnv is null", async () => {
    mockServerEnv = null;
    const request = makeMockRequest();

    const response = await updateSession(request);

    // Should have called NextResponse.next exactly once with the request
    expect(nextResponseNextCalls).toHaveLength(1);
    expect(nextResponseNextCalls[0].request).toBe(request);
    expect(response).toBeDefined();
  });

  test("does not call createServerClient when serverEnv is null", async () => {
    mockServerEnv = null;
    const request = makeMockRequest();

    await updateSession(request);

    expect(mockCreateServerClientFn).not.toHaveBeenCalled();
  });

  test("does not call supabase.auth.getUser when serverEnv is null", async () => {
    mockServerEnv = null;
    const request = makeMockRequest();

    await updateSession(request);

    expect(mockGetUserFn).not.toHaveBeenCalled();
  });

  test("early-return response does not depend on any Supabase credentials", async () => {
    // Even with completely empty/invalid creds the null-guard fires first
    mockServerEnv = null;
    const request = makeMockRequest();

    // Should resolve without throwing
    const response = await updateSession(request);
    expect(response).toBeDefined();
  });
});

describe("updateSession – Supabase configured", () => {
  beforeEach(() => {
    mockServerEnv = {
      supabaseUrl: "https://test.supabase.co",
      supabaseAnonKey: "test-anon-key",
    };
  });

  test("calls createServerClient with the URL and anon key from serverEnv", async () => {
    const request = makeMockRequest();

    await updateSession(request);

    expect(mockCreateServerClientFn).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key",
      expect.any(Object),
    );
  });

  test("calls supabase.auth.getUser to refresh the session", async () => {
    const request = makeMockRequest();

    await updateSession(request);

    expect(mockGetUserFn).toHaveBeenCalled();
  });

  test("returns a response (supabaseResponse) after session refresh", async () => {
    const request = makeMockRequest();

    const response = await updateSession(request);

    expect(response).toBeDefined();
  });

  test("passes request cookies via getAll cookie adapter", async () => {
    const cookies = [
      { name: "sb-access-token", value: "tok123" },
      { name: "sb-refresh-token", value: "ref456" },
    ];
    const request = makeMockRequest(cookies);

    await updateSession(request);

    // Verify createServerClient received a cookies object with getAll
    const [, , cookieOptions] = mockCreateServerClientFn.mock.calls[0] as [
      string,
      string,
      { cookies: { getAll: () => unknown } },
    ];
    expect(cookieOptions.cookies.getAll()).toEqual(cookies);
  });

  test("still calls createServerClient when cookies list is empty", async () => {
    const request = makeMockRequest([]);

    await updateSession(request);

    expect(mockCreateServerClientFn).toHaveBeenCalledTimes(1);
  });
});

describe("updateSession – behaviour switch between configured and unconfigured", () => {
  test("returns early (no Supabase call) then processes session on next call", async () => {
    const request = makeMockRequest();

    // First call: unconfigured
    mockServerEnv = null;
    await updateSession(request);
    expect(mockCreateServerClientFn).not.toHaveBeenCalled();

    // Second call: configured
    mockCreateServerClientFn.mockClear();
    mockServerEnv = {
      supabaseUrl: "https://test.supabase.co",
      supabaseAnonKey: "test-anon-key",
    };
    await updateSession(request);
    expect(mockCreateServerClientFn).toHaveBeenCalledTimes(1);
  });
});