// PROTOTYPE — Variant A: "Tile".
//
// The literal read of the idea: the source checklist SVG's *outer rounded square is the
// app tile itself*, so nothing is drawn twice. Two ticks on the left, D over N on the
// right where the two horizontal rules were, white on indigo.
//
// The stance is that the icon and the wordmark are separate objects that never appear
// together. The icon lives on a home screen and in a browser tab; inside the app the
// name is just set type, because a mark beside the wordmark in a 208px sidebar is 20px
// of indigo competing with the four tab icons directly below it. The empty cards get
// nothing to do with the brand at all — they get a picture of *the surface*, so the
// mark on the tree card and the mark on the Due card differ, which is the only way a
// mark can tell you which screen came up empty.
import { Check, Letter, Tile, type IconProps, type IdentityPack, type Surface } from "../identity";

// Amended while being judged: the artwork is scaled to 0.88 about the centre so every
// stroke clears Android's circular maskable crop (r=40 on the 100 grid — the unscaled
// N's bottom-right corner sat at 43). One artwork, not two: a separate tighter icon for
// the non-maskable sizes would be a second file to keep in step for a few percent of
// square, and most app icons carry optical padding anyway.
function Icon(p: IconProps) {
  return (
    <Tile {...p}>
      <g transform="translate(50 50) scale(0.88) translate(-50 -50)">
        <Check cx={31} cy={34} r={13} w={8} />
        <Check cx={31} cy={68} r={13} w={8} />
        <Letter ch="D" cx={69} cy={34} size={34} />
        <Letter ch="N" cx={69} cy={68} size={34} />
      </g>
    </Tile>
  );
}

function Wordmark({ size }: { size: number }) {
  return (
    <span
      className="font-semibold text-primary"
      style={{ fontSize: size, letterSpacing: "-0.025em", lineHeight: 1 }}
    >
      DueNow
    </span>
  );
}

/** Sign-in: the wordmark alone over the card, exactly as ADR-0028 wrote it. */
function SignInLockup() {
  return (
    <div className="mb-5 text-center">
      <Wordmark size={26} />
    </div>
  );
}

function SidebarLockup() {
  return (
    <div className="flex h-12 items-center px-3">
      <Wordmark size={15} />
    </div>
  );
}

/* The card mark describes the surface, not the product. Outline pictograms in the
   register ADR-0014 already uses for the tab icons. */
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Glyph({ surface }: { surface: Surface }) {
  switch (surface) {
    case "tree-first-run":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22" {...{}}>
          <g {...stroke}>
            <path d="M4 6h16M8 12h12M12 18h8" />
          </g>
        </svg>
      );
    case "tree-settled":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22">
          <g {...stroke}>
            <path d="M4 12.5 9 17.5 20 6.5" />
          </g>
        </svg>
      );
    case "due-first-run":
    case "due-clear":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22">
          <g {...stroke}>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5V12l3 2" />
          </g>
        </svg>
      );
    case "unselected":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22">
          <g {...stroke}>
            <rect x="3.5" y="5" width="17" height="14" rx="2" />
            <path d="M10 5v14" />
          </g>
        </svg>
      );
    case "rejected":
      return (
        <svg viewBox="0 0 24 24" width="22" height="22">
          <g {...stroke}>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M9 9l6 6M15 9l-6 6" />
          </g>
        </svg>
      );
  }
}

function CardMark({ surface }: { surface: Surface }) {
  return (
    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
      <Glyph surface={surface} />
    </div>
  );
}

const pack: IdentityPack = {
  key: "A",
  name: "Tile — the tile is the frame, the card marks describe the surface",
  claim:
    "The icon is the checklist with the outer square dropped, because the app tile already draws it. The wordmark is set type and stands alone. Every empty card is headed by a picture of the surface, so the tree, the Due tab and the unselected column never wear the same mark.",
  Icon,
  Wordmark,
  SignInLockup,
  SidebarLockup,
  CardMark,
};

export default pack;
