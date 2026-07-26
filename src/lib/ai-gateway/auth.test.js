import { afterEach, describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { authorizeGatewayRequest, secretsEqual } from "./auth.ts";
import { GATEWAY_AUTH_HEADER_NAME, GATEWAY_SECRET_ENV } from "./constants.ts";

describe("secretsEqual", () => {
  test("matches identical secrets", () => {
    expect(secretsEqual("gateway-secret-value", "gateway-secret-value")).toBe(true);
  });

  test("rejects different secrets of same length", () => {
    expect(secretsEqual("aaaaaaaa", "bbbbbbbb")).toBe(false);
  });

  test("rejects different lengths without throwing", () => {
    expect(secretsEqual("short", "much-longer-secret")).toBe(false);
  });
});

describe("authorizeGatewayRequest", () => {
  const prev = process.env[GATEWAY_SECRET_ENV];

  afterEach(() => {
    if (prev === undefined) delete process.env[GATEWAY_SECRET_ENV];
    else process.env[GATEWAY_SECRET_ENV] = prev;
  });

  function requestWithSecret(secret) {
    const headers = new Headers({ "Content-Type": "application/json" });
    if (secret !== undefined) headers.set(GATEWAY_AUTH_HEADER_NAME, secret);
    return new NextRequest("http://localhost/api/gateway", {
      method: "POST",
      headers,
    });
  }

  test("returns 503 when GATEWAY_SECRET is unset", () => {
    delete process.env[GATEWAY_SECRET_ENV];
    const result = authorizeGatewayRequest(requestWithSecret("anything"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(503);
      expect(result.code).toBe("gateway_misconfigured");
    }
  });

  test("returns 401 when header is missing", () => {
    process.env[GATEWAY_SECRET_ENV] = "correct-secret";
    const result = authorizeGatewayRequest(requestWithSecret(undefined));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.code).toBe("unauthorized");
    }
  });

  test("returns 401 when secret does not match", () => {
    process.env[GATEWAY_SECRET_ENV] = "correct-secret";
    const result = authorizeGatewayRequest(requestWithSecret("wrong-secret"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.code).toBe("unauthorized");
    }
  });

  test("returns ok when secret matches", () => {
    process.env[GATEWAY_SECRET_ENV] = "correct-secret";
    const result = authorizeGatewayRequest(requestWithSecret("correct-secret"));
    expect(result.ok).toBe(true);
  });
});
