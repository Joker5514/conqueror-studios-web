/** Parse the comma-separated CONSOLE_OWNER_EMAILS allowlist. */
export function parseConsoleOwnerEmails(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}
