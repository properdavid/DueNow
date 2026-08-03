// PROTOTYPE — Variant C: "Monogram".
//
// The reduction, and the ticket's own guess: no checklist at all. D over N, white on
// indigo, tight — one shape with nothing in it that has to survive being 16px in a
// browser tab. It exists to answer one question the other two cannot ask of themselves:
// **do the ticks earn their space?** Put A, B and C side by side at 16 and 32 in the
// icon sheet and the ticks are either still legible or they are texture.
//
// It takes the same austerity everywhere else. The wordmark carries its own join by
// weight rather than by capitals — due Now — so there is no mark beside it anywhere.
// And the empty cards are headed by marks the app *already owns*: ADR-0018's amber
// Topic star, ADR-0003's status marks, ADR-0020's urgency edge. Nothing is drawn for
// the empty state that is not already on a populated row, so an empty screen looks like
// the app it belongs to rather than like an onboarding screen bolted to the front.
import { Letter, Tile, type IconProps, type IdentityPack, type Surface } from "../identity";
import { StatusIcon, TypeIcon } from "../screens";

function Icon(p: IconProps) {
  return (
    <Tile {...p}>
      <Letter ch="D" cx={50} cy={33} size={44} weight={700} />
      <Letter ch="N" cx={50} cy={69} size={44} weight={700} />
    </Tile>
  );
}

/** The join is weight, not a capital: "due" light, "Now" semibold. */
function Wordmark({ size }: { size: number }) {
  return (
    <span style={{ fontSize: size, letterSpacing: "-0.02em", lineHeight: 1 }}>
      <span className="font-light text-muted">due</span>
      <span className="font-semibold text-fg">Now</span>
    </span>
  );
}

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

/** Marks lifted from the app's own vocabulary, bare — no disc, no soft fill. */
function CardMark({ surface }: { surface: Surface }) {
  const inner = (() => {
    switch (surface) {
      case "tree-first-run":
        // ADR-0018's Topic star, at size: "start with a Topic" said as a picture.
        return <TypeIcon type="Topic" size={26} />;
      case "tree-settled":
        return <StatusIcon status="Completed" size={28} />;
      case "due-first-run":
      case "due-clear":
        // ADR-0020's urgency edge with nothing to colour it.
        return (
          <svg width="26" height="28" viewBox="0 0 26 28">
            <rect x="1" y="2" width="3.5" height="24" rx="1.75" fill="var(--color-faint)" />
            <rect x="9" y="6" width="16" height="2.5" rx="1.25" fill="var(--color-line)" />
            <rect x="9" y="13" width="12" height="2.5" rx="1.25" fill="var(--color-line)" />
            <rect x="9" y="20" width="14" height="2.5" rx="1.25" fill="var(--color-line)" />
          </svg>
        );
      case "unselected":
        // The four type marks in ladder order — what the pane is for, in the app's own alphabet.
        return (
          <span className="flex items-center gap-1.5">
            <TypeIcon type="Topic" size={15} />
            <TypeIcon type="Project" size={15} />
            <TypeIcon type="Task" size={15} />
            <TypeIcon type="Subtask" size={15} />
          </span>
        );
      case "rejected":
        // ADR-0027's initials disc, with nobody in it.
        return (
          <svg width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="12.5" fill="none" stroke="var(--color-faint)" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M9.5 9.5l9 9M18.5 9.5l-9 9" stroke="var(--color-faint)" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        );
    }
  })();

  return <div className="mx-auto mb-3 flex h-8 items-center justify-center">{inner}</div>;
}

const pack: IdentityPack = {
  key: "C",
  name: "Monogram — no ticks, no lockup, and the cards borrow the app's own marks",
  claim:
    "D over N and nothing else, to test whether the ticks are still legible at 16px or just texture. The wordmark joins by weight — due Now — and no mark travels with it. Empty cards are headed by marks the app already owns: the Topic star, the Completed check, the urgency edge.",
  Icon,
  Wordmark,
  SignInLockup,
  SidebarLockup,
  CardMark,
};

export default pack;
