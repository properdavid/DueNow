// PROTOTYPE — Variant B: "Badge".
//
// The source SVG kept whole: the rounded square is *drawn*, in white, inside the indigo
// tile, with the two ticks and D over N inside it. That makes the mark a self-contained
// object with its own edge, which is the property the other two variants do not have —
// and the whole variant is built on it.
//
// Because it has an edge, the mark can leave the tile: it sits at cap height beside the
// wordmark in the sign-in lockup *and* in the sidebar, and it is what heads every one of
// ADR-0028's empty cards, in one flat grey, on all five surfaces. One mark, everywhere.
// The claim is that a household of two learns one shape and reads it as "DueNow has
// something to say" — the headline says which screen. The cost is that the mark is now
// on screen at all times and prints twice whenever a card and the sidebar share a view.
import { Check, Letter, Tile, type IconProps, type IdentityPack } from "../identity";

/** The mark itself, drawable in any colour on any background. */
function Mark({ size, color = "#fff" }: { size: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
      <rect x="9" y="9" width="82" height="82" rx="24" fill="none" stroke={color} strokeWidth="7" />
      <Check cx={37} cy={36} r={10} w={6.5} color={color} />
      <Check cx={37} cy={65} r={10} w={6.5} color={color} />
      <Letter ch="D" cx={68} cy={36} size={26} color={color} />
      <Letter ch="N" cx={68} cy={65} size={26} color={color} />
    </svg>
  );
}

function Icon(p: IconProps) {
  return (
    <Tile {...p}>
      <g transform="translate(50 50) scale(0.86) translate(-50 -50)">
        <rect x="9" y="9" width="82" height="82" rx="24" fill="none" stroke="#fff" strokeWidth="7" />
        <Check cx={37} cy={36} r={10} w={6.5} />
        <Check cx={37} cy={65} r={10} w={6.5} />
        <Letter ch="D" cx={68} cy={36} size={26} />
        <Letter ch="N" cx={68} cy={65} size={26} />
      </g>
    </Tile>
  );
}

function Wordmark({ size }: { size: number }) {
  return (
    <span className="font-semibold text-fg" style={{ fontSize: size, letterSpacing: "-0.025em", lineHeight: 1 }}>
      DueNow
    </span>
  );
}

/** The mark and the name as one object — the thing A refuses to build. */
function Lockup({ size }: { size: number }) {
  return (
    <span className="inline-flex items-center" style={{ gap: size * 0.36 }}>
      <span
        className="flex shrink-0 items-center justify-center rounded-[22%] bg-primary"
        style={{ width: size * 1.22, height: size * 1.22 }}
      >
        <Mark size={size * 1.06} />
      </span>
      <Wordmark size={size} />
    </span>
  );
}

function SignInLockup() {
  return (
    <div className="mb-5 flex justify-center">
      <Lockup size={24} />
    </div>
  );
}

function SidebarLockup() {
  return (
    <div className="flex h-12 items-center px-3">
      <Lockup size={15} />
    </div>
  );
}

/** One mark on every card, in one flat grey — it identifies the app, not the screen. */
function CardMark() {
  return (
    <div className="mx-auto mb-3 flex h-11 justify-center text-faint">
      <Mark size={40} color="currentColor" />
    </div>
  );
}

const pack: IdentityPack = {
  key: "B",
  name: "Badge — the mark has an edge, so it travels: lockup, sidebar, every empty card",
  claim:
    "The checklist square is drawn inside the tile rather than replaced by it, so the mark is a self-contained object. It locks up beside the wordmark on sign-in and in the sidebar, and the same shape heads all five empty cards in flat grey. One shape to learn; the headline says which screen.",
  Icon,
  Wordmark,
  SignInLockup,
  SidebarLockup,
  CardMark,
};

export default pack;
export { Mark };
