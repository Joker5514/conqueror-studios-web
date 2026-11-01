/**
 * CSV cell encoding for exports that may be opened in a spreadsheet. Run
 * inputs and outputs are user- or model-written text, so a cell starting
 * with = + - @ (or a tab/CR) is prefixed with an apostrophe to stop it being
 * evaluated as a formula.
 */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function csvCell(value: string | null | undefined): string {
  let text = value ?? "";
  if (FORMULA_PREFIX.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}
