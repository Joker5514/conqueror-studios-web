import { describe, expect, test } from "bun:test";
import {
  AGENT_LIMITS,
  isUuid,
  parseBoundedInt,
  validateAgentCreate,
  validateAgentPatch,
  validateCloneName,
  validateRunInput,
} from "./validate.ts";

describe("validateAgentCreate", () => {
  test("accepts a minimal agent and applies defaults", () => {
    const r = validateAgentCreate({ name: "  Researcher  " }, "gpt-4o");
    expect(r).toEqual({
      ok: true,
      value: { name: "Researcher", description: null, system_prompt: "", model: "gpt-4o", tools: [] },
    });
  });

  test("rejects non-object bodies and non-string names instead of throwing", () => {
    expect(validateAgentCreate([], "m").ok).toBe(false);
    expect(validateAgentCreate({ name: 42 }, "m")).toMatchObject({ ok: false, field: "name" });
    expect(validateAgentCreate({ name: "   " }, "m")).toMatchObject({ ok: false, field: "name" });
  });

  test("enforces length limits", () => {
    expect(validateAgentCreate({ name: "a".repeat(AGENT_LIMITS.name + 1) }, "m").ok).toBe(false);
    expect(validateAgentCreate({ name: "a", system_prompt: "x".repeat(AGENT_LIMITS.systemPrompt + 1) }, "m").ok).toBe(false);
  });

  test("names must be a single line", () => {
    expect(validateAgentCreate({ name: "line1\nline2" }, "m").ok).toBe(false);
  });

  test("hidden control characters are rejected, ordinary whitespace in prompts is kept", () => {
    expect(validateAgentCreate({ name: `bad${String.fromCharCode(0)}name` }, "m")).toMatchObject({ ok: false, field: "name" });
    expect(validateAgentCreate({ name: "a", system_prompt: `x${String.fromCharCode(27)}[31m` }, "m")).toMatchObject({
      ok: false,
      field: "system_prompt",
    });
    const multiline = validateAgentCreate({ name: "a", system_prompt: "line1\n\tline2\r\nline3" }, "m");
    expect(multiline.ok && multiline.value.system_prompt).toBe("line1\n\tline2\r\nline3");
  });

  test("tools must be an array of tool identifiers, deduplicated", () => {
    expect(validateAgentCreate({ name: "a", tools: "github.list_repos" }, "m")).toMatchObject({ ok: false, field: "tools" });
    expect(validateAgentCreate({ name: "a", tools: ["rm -rf /"] }, "m")).toMatchObject({ ok: false, field: "tools" });
    const r = validateAgentCreate({ name: "a", tools: ["github.list_repos", "github.list_repos"] }, "m");
    expect(r.ok && r.value.tools).toEqual(["github.list_repos"]);
    expect(validateAgentCreate({ name: "a", tools: Array.from({ length: 33 }, (_, i) => `t${i}`) }, "m").ok).toBe(false);
  });

  test("model must look like a model identifier", () => {
    expect(validateAgentCreate({ name: "a", model: "openai/gpt-4o-mini" }, "m").ok).toBe(true);
    expect(validateAgentCreate({ name: "a", model: "<script>" }, "m")).toMatchObject({ ok: false, field: "model" });
  });
});

describe("validateAgentPatch", () => {
  test("only includes fields that were sent", () => {
    expect(validateAgentPatch({ status: "active" })).toEqual({ ok: true, value: { status: "active" } });
    expect(validateAgentPatch({})).toEqual({ ok: true, value: {} });
  });

  test("rejects an unknown status instead of letting the database error", () => {
    expect(validateAgentPatch({ status: "deleted" })).toMatchObject({ ok: false, field: "status" });
  });

  test("description may be cleared with null", () => {
    expect(validateAgentPatch({ description: null })).toEqual({ ok: true, value: { description: null } });
  });
});

describe("helpers", () => {
  test("isUuid", () => {
    expect(isUuid("6f1f4c2e-8f4b-4f7e-9f1d-2b3c4d5e6f70")).toBe(true);
    expect(isUuid("1 or 1=1")).toBe(false);
  });

  test("clone names fall back and are bounded", () => {
    expect(validateCloneName(undefined, "Copy of A")).toEqual({ ok: true, value: "Copy of A" });
    const long = validateCloneName(undefined, `Copy of ${"a".repeat(200)}`);
    expect(long.ok && long.value.length).toBe(AGENT_LIMITS.name);
    expect(validateCloneName(7, "x").ok).toBe(false);
  });

  test("run input is required, a string, and bounded", () => {
    expect(validateRunInput(" hi ")).toEqual({ ok: true, value: "hi" });
    expect(validateRunInput(undefined).ok).toBe(false);
    expect(validateRunInput("x".repeat(AGENT_LIMITS.input + 1)).ok).toBe(false);
  });

  test("pagination parsing never yields NaN or negatives", () => {
    expect(parseBoundedInt("abc", 20, 1, 100)).toBe(20);
    expect(parseBoundedInt("-5", 0, 0, 10)).toBe(0);
    expect(parseBoundedInt("1e9", 20, 1, 100)).toBe(20);
    expect(parseBoundedInt("500", 20, 1, 100)).toBe(100);
    expect(parseBoundedInt(null, 20, 1, 100)).toBe(20);
  });
});
