import { describe, expect, test } from "bun:test";
import { normalizeWaitlistInput } from "./waitlist-input.ts";

const base = {
  email: "Ada@Example.com",
  name: "Ada",
  org: "Lab",
  interests: ["agents"],
  message: "hello",
};

describe("normalizeWaitlistInput", () => {
  test("normalizes a valid signup", () => {
    const result = normalizeWaitlistInput(base);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.email).toBe("ada@example.com");
  });

  test("rejects an invalid email", () => {
    const result = normalizeWaitlistInput({ ...base, email: "not-an-email" });
    expect(result.ok).toBe(false);
  });

  test("clips oversized fields and drops empty interests", () => {
    const result = normalizeWaitlistInput({
      ...base,
      name: "n".repeat(500),
      message: "m".repeat(5000),
      interests: ["", "ok", "x".repeat(200)],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name?.length).toBe(120);
      expect(result.value.message?.length).toBe(2000);
      expect(result.value.interests).toEqual(["ok", "x".repeat(80)]);
    }
  });
});
