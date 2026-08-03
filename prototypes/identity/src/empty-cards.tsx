// PROTOTYPE — throwaway. ADR-0028's card, held FIXED across all three variants of #29.
// Mark, headline, one line of explanation, at most one secondary link — never a create
// button. This file decided nothing new; it is the winner of #24, carried forward so the
// identity marks are judged in the place they will actually live.
//
// The one thing that swaps is what `<Mark/>` renders, which comes from the identity pack.
import { useState } from "react";
import type { DueEmptyProps, EmptyPack, SignInProps, TreeEmptyProps, UnselectedProps } from "./empty";
import { HOUSEHOLD_EMAIL } from "./empty";
import { absolute, relative } from "./due";
import { useIdentity, type Surface } from "./identity";
import { TypeIcon } from "./screens";

function Card({ surface, title, body, children }: { surface: Surface; title: string; body: string; children?: React.ReactNode }) {
  const id = useIdentity();
  return (
    <div className="mx-auto w-full max-w-[380px] rounded-xl border border-line bg-bg px-6 py-8 text-center shadow-sm">
      <id.CardMark surface={surface} />
      <p className="text-[17px] font-semibold tracking-tight">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[300px] text-[13px] leading-relaxed text-muted">{body}</p>
      {children && <div className="mt-5 flex flex-col items-center gap-2">{children}</div>}
    </div>
  );
}

function Primary({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="touch-min rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-primary-fg shadow-sm"
    >
      {children}
    </button>
  );
}

function Secondary({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="touch-min px-3 py-1.5 text-[13px] text-primary hover:underline">
      {children}
    </button>
  );
}

function SignIn({ rejected, email, onSignIn, onRetry }: SignInProps) {
  const id = useIdentity();
  return (
    <div className="flex h-full items-center justify-center bg-surface px-5">
      <div className="w-full max-w-[380px]">
        <id.SignInLockup />
        {rejected ? (
          <Card
            surface="rejected"
            title="You can't sign in here"
            body={`${email} isn't one of the accounts set up for this household. If you have another Google account, try that one — otherwise ask whoever set this up to add you.`}
          >
            <Primary onClick={onRetry}>Try another account</Primary>
          </Card>
        ) : (
          <div className="rounded-xl border border-line bg-bg px-6 py-8 text-center shadow-sm">
            <p className="text-[17px] font-semibold tracking-tight">Your household's work, in one place</p>
            <p className="mx-auto mt-1.5 max-w-[300px] text-[13px] leading-relaxed text-muted">
              Sign in with the Google account your household already uses.
            </p>
            <button
              onClick={onSignIn}
              className="touch-min mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-line bg-bg py-2.5 text-[14px] font-medium shadow-sm hover:bg-surface"
            >
              <span className="text-[16px]">G</span> Continue with Google
            </button>
            <p className="mt-4 text-[12px] text-faint">Only accounts set up for this household can sign in.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// The card never carries a create button: the FAB (compact) and the sidebar button
// (split) are both on screen already, and the empty state is the moment to teach where
// creation lives rather than to offer a second door to it.
function TreeEmpty({ firstRun, settled, onReveal }: TreeEmptyProps) {
  return (
    <div className="px-5 py-12">
      {firstRun ? (
        <Card
          surface="tree-first-run"
          title="Nothing here yet"
          body="Start with a Topic — a standing area of household life, like House or Travel. Projects, Tasks and Subtasks hang off it."
        />
      ) : (
        <Card
          surface="tree-settled"
          title="All settled"
          body="Nothing is unfinished. Everything either of you has created has been completed or closed."
        >
          <Secondary onClick={onReveal}>Show {settled} settled</Secondary>
        </Card>
      )}
    </div>
  );
}

function DueEmpty({ firstRun }: DueEmptyProps) {
  return (
    <div className="px-5 py-12">
      {firstRun ? (
        <Card
          surface="due-first-run"
          title="Nothing due yet"
          body="This is where dated work shows up, 30 days ahead. Create your first work item and give it a due date."
        />
      ) : (
        <Card surface="due-clear" title="Nothing on the radar" body="No work is due in the next 30 days." />
      )}
    </div>
  );
}

function Unselected({ rows, firstRun, onOpen }: UnselectedProps) {
  const [hover, setHover] = useState(false);
  return (
    <div className="flex h-full items-center justify-center bg-surface px-6">
      <Card
        surface="unselected"
        title="Nothing selected"
        body={
          firstRun
            ? "Once there is work in the tree, the item you pick opens here beside it."
            : "Pick a work item on the left and it opens here, beside the list."
        }
      >
        {rows.length > 0 && (
          <button
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={() => onOpen(rows[0].item.id)}
            className="flex items-center gap-1.5 text-[12px] text-primary"
          >
            <TypeIcon type={rows[0].item.type} size={11} />
            <span className={hover ? "underline" : ""}>Open the next thing due</span>
            <span className="text-faint">
              {relative(rows[0].days)} · {absolute(rows[0].item.due!)}
            </span>
          </button>
        )}
      </Card>
    </div>
  );
}

const pack: EmptyPack = { name: "Signpost (ADR-0028, fixed)", SignIn, TreeEmpty, DueEmpty, Unselected };
export default pack;
export { HOUSEHOLD_EMAIL };
