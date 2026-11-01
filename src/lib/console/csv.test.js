import { describe, expect, test } from "bun:test";
import { csvCell } from "./csv.ts";

describe("csvCell", () => {
  test("neutralizes spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(\"http://evil\",\"x\")")).toBe("\"'=HYPERLINK(\"\"http://evil\"\",\"\"x\"\")\"");
    expect(csvCell("+1+1")).toBe("'+1+1");
    expect(csvCell("-2")).toBe("'-2");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  test("quotes commas, quotes, and newlines", () => {
    expect(csvCell("a,b")).toBe("\"a,b\"");
    expect(csvCell("line1\nline2")).toBe("\"line1\nline2\"");
  });

  test("passes plain values through", () => {
    expect(csvCell("done")).toBe("done");
    expect(csvCell(null)).toBe("");
  });
});
