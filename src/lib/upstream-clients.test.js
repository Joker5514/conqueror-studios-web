import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { getBridgeToolSchema } from "./bridge-client.ts";
import { postNexusRun } from "./nexus-client.ts";

let originalFetch;
let saved;
let silence;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  saved = { NEXUS_URL: process.env.NEXUS_URL, BRIDGE_URL: process.env.BRIDGE_URL };
  process.env.NEXUS_URL = "https://nexus.example.test";
  process.env.BRIDGE_URL = "https://bridge.example.test";
  silence = console.error;
  console.error = () => {};
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  console.error = silence;
});

function respond(status, body) {
  globalThis.fetch = async () =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
}

describe("upstream error normalization", () => {
  test("a Bridge 401 becomes a stable 502 without the upstream body", async () => {
    respond(401, { detail: "Unauthorized.", error: { code: "unauthorized", message: "Unauthorized." } });
    const result = await getBridgeToolSchema();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(502);
      expect(result.code).toBe("bridge_auth_failed");
      expect(JSON.stringify(result)).not.toContain("detail");
    }
  });

  test("a Nexus 502 with upstream text does not leak that text", async () => {
    respond(502, { detail: "Bridge error: Bridge returned 401 for tool 'x': internal secret text" });
    const result = await postNexusRun({ query: "q" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(502);
      expect(result.code).toBe("nexus_upstream_error");
      expect(JSON.stringify(result)).not.toContain("internal secret text");
    }
  });

  test("a Nexus 504 stays a 504", async () => {
    respond(504, { detail: "timeout" });
    const result = await postNexusRun({ query: "q" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(504);
  });

  test("a successful JSON response passes through", async () => {
    respond(200, { correlation_id: "c", routing_mode: "assisted", result: { answer: "hi" }, trace: {} });
    const result = await postNexusRun({ query: "q" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.result.answer).toBe("hi");
  });

  test("an unset Bridge URL is a 503 configuration error, not a request to localhost", async () => {
    delete process.env.BRIDGE_URL;
    let called = false;
    globalThis.fetch = async () => {
      called = true;
      return new Response("{}");
    };
    const result = await getBridgeToolSchema();
    expect(called).toBe(false);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(503);
  });
});
