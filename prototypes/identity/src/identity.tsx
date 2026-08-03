// PROTOTYPE — throwaway. The seam the three identity variants plug into (#29).
//
// Three things are being decided and they are not the same thing:
//   1. the WORDMARK — what "DueNow" looks like set, and whether a mark travels with it
//   2. the APP ICON — one square that must survive 512px on a splash and 16px in a tab,
//      plus Android's maskable crop (ADR-0029 precaches all of them)
//   3. the CARD MARK — the thing ADR-0028 put at the top of every empty card, on five
//      surfaces, which may or may not be the brand mark
//
// Everything else on screen is held fixed: the shell (ADR-0017), the tree (ADR-0018),
// the detail view (ADR-0019), the Due tab (ADR-0020), Search (ADR-0021), and ADR-0028's
// card layout itself — mark, headline, one line, at most one secondary link.
import { createContext, useContext } from "react";

/** The five places ADR-0028 puts a card, plus the two states each of the first two has. */
export type Surface =
  | "tree-first-run"
  | "tree-settled"
  | "due-first-run"
  | "due-clear"
  | "unselected"
  | "rejected";

export type IconProps = {
  size: number;
  /** Draw Android's 80% safe zone and the circular crop over the top. */
  maskable?: boolean;
  /** One-colour rendering — the favicon fallback and the monochrome test. */
  mono?: boolean;
};

export type IdentityPack = {
  key: string;
  name: string;
  /** One line, printed in the spec sheet, saying what this direction claims. */
  claim: string;
  /** The app icon, square, self-contained — includes its own background. */
  Icon: (p: IconProps) => React.ReactNode;
  /** The name set as type. `size` is the cap size in px. */
  Wordmark: (p: { size: number }) => React.ReactNode;
  /** What heads the sign-in screen, above ADR-0028's one card. */
  SignInLockup: () => React.ReactNode;
  /** What sits in the 208px sidebar header in split layout. */
  SidebarLockup: () => React.ReactNode;
  /** ADR-0028's "a mark", per surface. 44px box. */
  CardMark: (p: { surface: Surface }) => React.ReactNode;
};

export const IdentityContext = createContext<IdentityPack | null>(null);
export const useIdentity = () => useContext(IdentityContext)!;

/* ------------------------------------------------------------------ */
/* shared drawing atoms — the source SVG's vocabulary, on a 100 grid   */
/* ------------------------------------------------------------------ */

export const INDIGO = "hsl(245 55% 52%)";

/** A tick in the source SVG's proportions: short arm down-right, long arm up-right. */
export function Check({ cx, cy, r, w, color = "#fff" }: { cx: number; cy: number; r: number; w: number; color?: string }) {
  return (
    <polyline
      points={`${cx - r},${cy + r * 0.08} ${cx - r * 0.32},${cy + r * 0.72} ${cx + r},${cy - r * 0.78}`}
      fill="none"
      stroke={color}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** A letter set as type where the source SVG had a horizontal rule. */
export function Letter({
  ch,
  cx,
  cy,
  size,
  color = "#fff",
  weight = 700,
}: {
  ch: string;
  cx: number;
  cy: number;
  size: number;
  color?: string;
  weight?: number;
}) {
  return (
    <text
      x={cx}
      y={cy}
      fill={color}
      fontSize={size}
      fontWeight={weight}
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily='Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
      letterSpacing={-1}
    >
      {ch}
    </text>
  );
}

/** The indigo square every variant's icon sits on, plus the maskable overlay. */
export function Tile({
  size,
  maskable,
  mono,
  radius = 22,
  children,
}: IconProps & { radius?: number; children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", borderRadius: maskable ? 0 : (size * radius) / 100 }}>
      <rect width="100" height="100" fill={mono ? "hsl(240 6% 10%)" : INDIGO} />
      {children}
      {maskable && (
        <>
          <circle cx="50" cy="50" r="40" fill="none" stroke="#fff" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.85" />
          <rect x="10" y="10" width="80" height="80" fill="none" stroke="#fff" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.45" />
        </>
      )}
    </svg>
  );
}
