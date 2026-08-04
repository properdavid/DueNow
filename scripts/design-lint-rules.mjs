/**
 * The five design-lint rules (ADR-0014, ADR-0015).
 *
 * Every colour in DueNow comes from a semantic token and every type size comes
 * from the closed scale, so each of these rules describes a way of reaching past
 * the design system. There is no ratchet baseline: a violation is a failure.
 */

const PALETTE_PREFIXES = [
  "bg",
  "text",
  "border",
  "ring",
  "fill",
  "stroke",
  "from",
  "via",
  "to",
  "outline",
  "decoration",
  "divide",
  "placeholder",
  "caret",
  "accent",
  "shadow",
].join("|");

const PALETTE_HUES = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
].join("|");

const PALETTE_STEPS = "50|100|200|300|400|500|600|700|800|900|950";

const COLOUR_FUNCTIONS = "rgba?|hsla?|oklch|oklab|lab|lch|color-mix";

/** Utilities whose arbitrary value would be a colour. */
const COLOUR_PREFIXES = PALETTE_PREFIXES;

/** The one restricted typography role, and the only size off the scale. */
const ALLOWED_ARBITRARY_FONT_SIZES = new Set(["10px"]);

export const RULES = [
  {
    name: "raw-palette",
    message: "raw Tailwind palette utility — use a semantic token",
    patterns: [
      new RegExp(`\\b(?:${PALETTE_PREFIXES})-(?:${PALETTE_HUES})-(?:${PALETTE_STEPS})\\b`, "g"),
    ],
  },
  {
    name: "raw-hex",
    message: "raw hex colour — use a semantic token",
    patterns: [/#[0-9a-fA-F]{3,8}\b/g],
  },
  {
    name: "dark-variant",
    message: "`dark:` utility — the token block redefines itself per mode (ADR-0015)",
    // A variant can stack behind another one, so `dark:` is caught wherever it sits.
    patterns: [/(?<=^|[\s"'`{(:])dark:/g],
  },
  {
    name: "arbitrary-colour",
    message: "arbitrary colour value — use a semantic token",
    patterns: [
      new RegExp(`-\\[(?:#[0-9a-fA-F]{3,8}|(?:${COLOUR_FUNCTIONS})\\([^\\]]*\\))\\]`, "g"),
      /\[(?:color|background-color|border-color|outline-color|fill|stroke)\s*:[^\]]*\]/g,
      // A colour-taking utility reaching for a raw custom property is reaching
      // past the token that already exists as a utility.
      new RegExp(`\\b(?:${COLOUR_PREFIXES})-\\[var\\(--[^\\]]*\\)\\]`, "g"),
    ],
  },
  {
    name: "arbitrary-font-size",
    message: "arbitrary font size — the scale is closed (text-[10px] excepted)",
    patterns: [/\btext-\[(?:length:)?(-?[\d.]+(?:px|rem|em|pt|ch|vw|vh))\]/g],
    ignore: (match) => ALLOWED_ARBITRARY_FONT_SIZES.has(match[1]),
  },
];

function lineOf(source, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (source[i] === "\n") line += 1;
  }
  return line;
}

/**
 * @param {string} source
 * @returns {{rule: string, message: string, line: number, match: string}[]}
 */
export function findViolations(source) {
  const violations = [];

  RULES.forEach((rule, ruleIndex) => {
    for (const pattern of rule.patterns) {
      for (const match of source.matchAll(pattern)) {
        if (rule.ignore?.(match)) continue;
        violations.push({
          rule: rule.name,
          message: rule.message,
          line: lineOf(source, match.index),
          match: match[0],
          ruleIndex,
          index: match.index,
        });
      }
    }
  });

  return violations
    .sort((a, b) => a.line - b.line || a.ruleIndex - b.ruleIndex || a.index - b.index)
    .map(({ rule, message, line, match }) => ({ rule, message, line, match }));
}
