import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Every source file under `dir`, depth-first and in a stable order.
 *
 * The walk is shared by `design-lint` and by the tests that assert a convention
 * across the source tree, so both agree on what "the source" is.
 *
 * @param {string} dir
 * @param {string[]} extensions
 * @returns {Generator<string>}
 */
export function* sourceFiles(dir, extensions) {
  for (const entry of readdirSync(dir).sort()) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      yield* sourceFiles(path, extensions);
    } else if (extensions.some((extension) => entry.endsWith(extension))) {
      yield path;
    }
  }
}
