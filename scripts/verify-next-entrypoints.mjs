// Verifies that required Next.js entrypoint files are present before running
// a full build. Fails fast so CI doesn't spend minutes on a build that would
// error at the same place.
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const required = [
  "src/middleware.ts",
  "src/app/layout.tsx",
  "src/app/page.tsx",
];

let allFound = true;
for (const rel of required) {
  if (existsSync(join(root, rel))) {
    console.log(`  ok  ${rel}`);
  } else {
    console.error(`  MISSING  ${rel}`);
    allFound = false;
  }
}

if (!allFound) {
  console.error("\nMissing required Next.js entrypoints.");
  process.exit(1);
}

console.log("\nAll entrypoints present.");
