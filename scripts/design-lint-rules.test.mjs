import { describe, expect, it } from "vitest";

import { findViolations, RULES } from "./design-lint-rules.mjs";

const rulesFor = (source) => findViolations(source).map((v) => v.rule);

describe("no raw palette utilities", () => {
  it("rejects a Tailwind palette utility", () => {
    expect(rulesFor('<div className="bg-slate-50" />')).toEqual(["raw-palette"]);
  });

  it("rejects every prefix that can take a colour", () => {
    for (const prefix of ["bg", "text", "border", "ring", "fill", "stroke"]) {
      expect(rulesFor(`className="${prefix}-blue-600"`)).toEqual(["raw-palette"]);
    }
  });

  it("accepts semantic tokens that merely look like a palette utility", () => {
    expect(rulesFor('className="bg-primary text-muted-foreground border-input"')).toEqual([]);
    expect(rulesFor('className="text-type-topic text-status-in-progress"')).toEqual([]);
  });
});

describe("no raw hex", () => {
  it("rejects three, six and eight digit hex", () => {
    expect(rulesFor("color: #fff")).toEqual(["raw-hex"]);
    expect(rulesFor("color: #4d41c8")).toEqual(["raw-hex"]);
    expect(rulesFor("color: #4d41c880")).toEqual(["raw-hex"]);
  });

  it("accepts hsl written against a token", () => {
    expect(rulesFor("--color-primary: hsl(var(--primary));")).toEqual([]);
  });
});

describe("no dark: utilities", () => {
  it("rejects a dark variant", () => {
    expect(rulesFor('className="bg-card dark:bg-muted"')).toEqual(["dark-variant"]);
  });

  it("rejects a dark variant stacked behind another variant", () => {
    expect(rulesFor('className="md:dark:bg-muted"')).toEqual(["dark-variant"]);
    expect(rulesFor('className="hover:dark:text-foreground"')).toEqual(["dark-variant"]);
  });

  it("accepts the word dark outside a variant position", () => {
    expect(rulesFor("/* the dark token block is selected two ways */")).toEqual([]);
    expect(rulesFor('className="text-foreground"')).toEqual([]);
  });
});

describe("no arbitrary colour values", () => {
  it("rejects an arbitrary colour in any notation", () => {
    expect(rulesFor('className="bg-[#ff0000]"')).toContain("arbitrary-colour");
    expect(rulesFor('className="text-[rgb(0,0,0)]"')).toEqual(["arbitrary-colour"]);
    expect(rulesFor('className="border-[hsl(245_55%_52%)]"')).toEqual(["arbitrary-colour"]);
    expect(rulesFor('className="text-[oklch(0.5_0.1_240)]"')).toEqual(["arbitrary-colour"]);
    expect(rulesFor('className="[color:var(--whatever)]"')).toEqual(["arbitrary-colour"]);
  });

  it("rejects a colour-taking utility reaching for a raw custom property", () => {
    expect(rulesFor('className="bg-[var(--whatever)]"')).toEqual(["arbitrary-colour"]);
    expect(rulesFor('className="text-[var(--primary)]"')).toEqual(["arbitrary-colour"]);
  });

  it("accepts arbitrary values that are not colours", () => {
    expect(rulesFor('className="tracking-[-0.025em] [@media(any-pointer:coarse)]:min-h-11"')).toEqual(
      [],
    );
    expect(rulesFor('className="w-[var(--sidebar-width)] bg-[url(/mark.svg)]"')).toEqual([]);
  });
});

describe("no arbitrary font sizes", () => {
  it("rejects a size off the scale", () => {
    expect(rulesFor('className="text-[13px]"')).toEqual(["arbitrary-font-size"]);
    expect(rulesFor('className="text-[0.8rem]"')).toEqual(["arbitrary-font-size"]);
  });

  it("allows the one restricted role", () => {
    expect(rulesFor('className="text-[10px] font-bold uppercase tracking-wide"')).toEqual([]);
  });

  it("rejects the retired micro role", () => {
    expect(rulesFor('className="text-[11px]"')).toEqual(["arbitrary-font-size"]);
  });
});

describe("reporting", () => {
  it("reports the line number and the offending text", () => {
    const [violation] = findViolations('one\ntwo\n<div className="text-red-500" />\n');
    expect(violation).toMatchObject({ line: 3, rule: "raw-palette", match: "text-red-500" });
  });

  it("finds every violation, not just the first", () => {
    expect(rulesFor('className="bg-slate-50 dark:bg-slate-900"')).toEqual([
      "raw-palette",
      "raw-palette",
      "dark-variant",
    ]);
  });

  it("names all five rules", () => {
    expect(RULES.map((rule) => rule.name)).toEqual([
      "raw-palette",
      "raw-hex",
      "dark-variant",
      "arbitrary-colour",
      "arbitrary-font-size",
    ]);
  });
});
