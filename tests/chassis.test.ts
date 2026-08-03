import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// @ts-expect-error — a zero-dependency script module, deliberately untyped.
import { sourceFiles } from "../scripts/source-files.mjs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

describe("touch comfort", () => {
  it("expresses the 44px coarse-pointer minimum inside the primitives only", () => {
    const offenders = [...sourceFiles(join(repoRoot, "app"), [".ts", ".tsx"])]
      .filter((file: string) => readFileSync(file, "utf8").includes("any-pointer:coarse"))
      .map((file: string) => relative(repoRoot, file))
      .filter((file: string) => !file.startsWith(join("app", "components", "ui")));

    expect(offenders).toEqual([]);
  });
});

describe("the ~ alias", () => {
  const read = (file: string) => readFileSync(join(repoRoot, file), "utf8");

  it("points at the app directory in all three configs", () => {
    expect(read("tsconfig.json")).toContain('"~/*": ["./app/*"]');
    expect(read("vite.config.ts")).toContain('"~": new URL("./app", import.meta.url).pathname');
    expect(read("vitest.config.ts")).toContain('"~": new URL("./app", import.meta.url).pathname');
  });
});
