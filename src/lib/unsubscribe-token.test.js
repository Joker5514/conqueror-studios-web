import { afterEach, describe, expect, test } from "bun:test";
import {
  createUnsubscribeToken,
  isValidUnsubscribeToken,
} from "./unsubscribe-token.ts";

const previousSecret = process.env.UNSUBSCRIBE_TOKEN_SECRET;

afterEach(() => {
  if (previousSecret === undefined) delete process.env.UNSUBSCRIBE_TOKEN_SECRET;
  else process.env.UNSUBSCRIBE_TOKEN_SECRET = previousSecret;
});

describe("unsubscribe tokens", () => {
  test("creates a stable token for a normalized recipient address", () => {
    process.env.UNSUBSCRIBE_TOKEN_SECRET = "test-secret";

    expect(createUnsubscribeToken(" Member@Example.com ")).toBe(
      createUnsubscribeToken("member@example.com"),
    );
  });

  test("rejects a token for a different recipient", () => {
    process.env.UNSUBSCRIBE_TOKEN_SECRET = "test-secret";
    const token = createUnsubscribeToken("member@example.com");

    expect(token).toBeString();
    expect(isValidUnsubscribeToken("member@example.com", token)).toBe(true);
    expect(isValidUnsubscribeToken("other@example.com", token)).toBe(false);
  });

  test("does not issue or validate tokens without a configured secret", () => {
    delete process.env.UNSUBSCRIBE_TOKEN_SECRET;

    expect(createUnsubscribeToken("member@example.com")).toBeNull();
    expect(isValidUnsubscribeToken("member@example.com", "anything")).toBe(false);
  });
});
