import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../app/app.css", import.meta.url), "utf8");
/** The rules only — a comment may name a dropped family in order to say it is dropped. */
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, "");

describe("the token set", () => {
  it("declares itself in CSS, with no tailwind config file to disagree with", () => {
    expect(css).toContain("@theme inline");
  });

  it("leaves out the families ADR-0014 and ADR-0018 dropped", () => {
    const dropped = [
      "--color-chart-", // the chart ramp — no charts in v1
      "--label-", // a Label carries no colour (ADR-0018)
      "--font-serif",
      "--font-signature",
      "--font-mono",
      "-border-intensity", // the computed-border indirection
    ];
    for (const token of dropped) {
      expect(declarations).not.toContain(token);
    }
  });

  it("trims the shadow ramp to three rungs, all of them for floating UI", () => {
    expect(css).toContain("--shadow-sm");
    expect(css).toContain("--shadow-md");
    expect(css).toContain("--shadow-lg");
    for (const rung of ["--shadow-2xs", "--shadow-xs", "--shadow-xl", "--shadow-2xl"]) {
      expect(css).not.toContain(`${rung}:`);
    }
  });

  it("self-hosts Inter and fetches no remote font", () => {
    expect(css).toContain("@fontsource-variable/inter");
    expect(css).not.toContain("fonts.googleapis.com");
    expect(css).not.toContain("fonts.gstatic.com");
  });
});

describe("dark mode", () => {
  it("selects one declaration block two ways", () => {
    // The values are written once, inside `@variant dark`, so the class and the
    // media query can never drift apart (ADR-0015).
    expect(css.match(/@variant dark/g)).toHaveLength(1);
    expect(css.match(/--background: 240 8% 9%/g)).toHaveLength(1);
  });

  it("declares a matching custom variant covering both conditions", () => {
    const variant = css.slice(css.indexOf("@custom-variant dark"), css.indexOf("@theme inline"));
    expect(variant).toContain(".dark");
    expect(variant).toContain("prefers-color-scheme: dark");
    expect(variant).toContain(":root:not(.light)");
  });
});
