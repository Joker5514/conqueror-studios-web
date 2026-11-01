import { describe, expect, test } from "bun:test";
import { otpOutcome } from "./auth-otp-outcome.ts";

describe("otpOutcome (no account enumeration)", () => {
  test("a real send and an unknown address look identical", () => {
    const unknownAccount = { name: "AuthApiError", status: 422, message: "Signups not allowed for otp" };
    expect(otpOutcome(null)).toEqual({ kind: "sent" });
    expect(otpOutcome(unknownAccount)).toEqual({ kind: "sent" });
  });

  test("rate limiting is reported honestly", () => {
    expect(otpOutcome({ status: 429 })).toEqual({ kind: "rate_limited" });
  });

  test("server and network failures are reported as failures", () => {
    expect(otpOutcome({ status: 500 })).toEqual({ kind: "failed" });
    expect(otpOutcome({ name: "AuthRetryableFetchError" })).toEqual({ kind: "failed" });
  });
});
