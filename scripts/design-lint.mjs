#!/usr/bin/env node
/**
 * design-lint — a hard gate, with no ratchet baseline (ADR-0014).
 *
 * Zero dependencies. Walks the source root and fails on any violation of the
 * five rules in `design-lint-rules.mjs`.
 *
 * `prototypes/` is outside the source root on purpose: prototype tickets exist
 * to break these rules and live on throwaway branches. So is
 * `public/offline.html`, which is hand-written, self-contained and monochrome
 * (ADR-0029).
 */

import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { findViolations } from "./design-lint-rules.mjs";
import { sourceFiles } from "./source-files.mjs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const SOURCE_ROOTS = ["app"];
const EXTENSIONS = [".ts", ".tsx", ".css"];

let violationCount = 0;
let fileCount = 0;

for (const root of SOURCE_ROOTS) {
  for (const file of sourceFiles(join(repoRoot, root), EXTENSIONS)) {
    fileCount += 1;
    for (const violation of findViolations(readFileSync(file, "utf8"))) {
      violationCount += 1;
      console.error(
        `${relative(repoRoot, file)}:${violation.line}  ${violation.rule}  ${violation.match}` +
          `\n    ${violation.message}`,
      );
    }
  }
}

if (violationCount > 0) {
  console.error(
    `\ndesign-lint: ${violationCount} violation${violationCount === 1 ? "" : "s"} in ${fileCount} files`,
  );
  process.exit(1);
}

console.log(`design-lint: clean (${fileCount} files)`);
