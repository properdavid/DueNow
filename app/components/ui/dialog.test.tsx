import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

/* Radix portals render nothing on the server and there is no DOM environment, so
   the panel's layout rule is held where it is written. Layout itself is proven in
   a real browser at an iPhone viewport. */
const source = readFileSync(new URL("./dialog.tsx", import.meta.url), "utf8");
const panel = source.slice(source.indexOf("function DialogContent"), source.indexOf("function DialogHeader"));

describe("the dialog panel on a short viewport", () => {
  test("bounds its height by the visible viewport", () => {
    expect(panel).toContain("max-h-[calc(100dvh-2rem)]");
  });

  test("scrolls its own overflow rather than spilling past both edges", () => {
    expect(panel).toContain("overflow-y-auto");
  });

  test("does not rubber-band horizontally", () => {
    expect(panel).toContain("overflow-x-hidden");
  });

  test("keeps its vertical bounce without chaining to the page behind", () => {
    expect(panel).toContain("overscroll-y-contain");
  });
});
