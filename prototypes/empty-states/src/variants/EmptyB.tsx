// PROTOTYPE — Variant B: "Bare".
// No cards, no marks, no illustrations, and no buttons that duplicate a control already
// on screen. An empty surface says one dim sentence exactly where the first row would
// have been, in the same type as the rows it is standing in for. The stance is that
// ADR-0014's register is a dense professional one, that the household sees these screens
// hundreds of times, and that a full-page card is a beginner's screen shown to experts.
// The bet being tested: does this read as calm, or as broken?
import type { DueEmptyProps, EmptyPack, SignInProps, TreeEmptyProps, UnselectedProps } from "../empty";

function SignIn({ rejected, email, onSignIn, onRetry }: SignInProps) {
  return (
    <div className="flex h-full flex-col justify-center bg-bg px-8">
      <div className="mx-auto w-full max-w-[320px]">
        <p className="text-[15px] font-semibold tracking-tight text-primary">DueNow</p>
        {rejected ? (
          <>
            <p className="mt-6 text-[14px] leading-relaxed">{email} can't sign in to this DueNow.</p>
            <button onClick={onRetry} className="touch-min mt-4 text-[13px] text-primary hover:underline">
              Use a different account
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onSignIn}
              className="touch-min mt-6 w-full rounded border border-line py-2 text-[14px] font-medium hover:bg-surface"
            >
              Continue with Google
            </button>
            <p className="mt-3 text-[12px] text-faint">Household members only.</p>
          </>
        )}
      </div>
    </div>
  );
}

function TreeEmpty({ firstRun, settled, onReveal }: TreeEmptyProps) {
  // In flow, on the same border-t the rows sit on — the list is present, just empty.
  return (
    <ul className="border-t border-line">
      <li className="border-b border-line px-3 py-2 text-[13px] text-faint">
        {firstRun ? "No work items yet." : "Nothing unfinished."}
      </li>
      {!firstRun && settled > 0 && (
        <li>
          <button
            onClick={onReveal}
            className="w-full border-b border-line px-3 py-1.5 text-left text-[12px] text-faint hover:bg-surface"
          >
            {settled} settled — show
          </button>
        </li>
      )}
    </ul>
  );
}

function DueEmpty({ firstRun }: DueEmptyProps) {
  return (
    <p className="border-t border-line px-4 py-3 text-[13px] text-faint">
      {firstRun ? "No due dates yet." : "Nothing due in the next 30 days."}
    </p>
  );
}

function Unselected(_: UnselectedProps) {
  // Deliberately nothing at all: the tint and the divider already say "this pane is
  // waiting", and a sentence here is read once and then never again.
  return <div className="h-full bg-surface" />;
}

const pack: EmptyPack = { name: "Bare", SignIn, TreeEmpty, DueEmpty, Unselected };
export default pack;
