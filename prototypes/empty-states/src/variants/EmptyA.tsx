// PROTOTYPE — Variant A: "Signpost".
// Every screen with nothing in it is a centred card: a mark, a headline, one line of
// explanation, and a way forward. The stance is that an empty screen is a moment of
// doubt — the user is asking "is it broken, or is there genuinely nothing?" — and the
// card answers it loudly. The cost is that the loudest thing on the healthiest screen
// (a clear radar) is a box telling you so.
import { useState } from "react";
import type { DueEmptyProps, EmptyPack, SignInProps, TreeEmptyProps, UnselectedProps } from "../empty";
import { HOUSEHOLD_EMAIL } from "../empty";
import { absolute, relative } from "../due";
import { TypeIcon } from "../screens";

function Card({ mark, title, body, children }: { mark: string; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[380px] rounded-xl border border-line bg-bg px-6 py-8 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-[20px] text-primary">
        {mark}
      </div>
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
  return (
    <div className="flex h-full items-center justify-center bg-surface px-5">
      <div className="w-full max-w-[380px]">
        <p className="mb-5 text-center text-[22px] font-semibold tracking-tight text-primary">DueNow</p>
        {rejected ? (
          <Card
            mark="✕"
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
          mark="☰"
          title="Nothing here yet"
          body="Start with a Topic — a standing area of household life, like House or Travel. Projects, Tasks and Subtasks hang off it."
        />
      ) : (
        <Card
          mark="✓"
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
          mark="◷"
          title="Nothing due yet"
          body="This is where dated work shows up, 30 days ahead. Create your first work item and give it a due date."
        />
      ) : (
        <Card mark="◷" title="Nothing on the radar" body="No work is due in the next 30 days." />
      )}
    </div>
  );
}

function Unselected({ rows, firstRun, onOpen }: UnselectedProps) {
  const [hover, setHover] = useState(false);
  return (
    <div className="flex h-full items-center justify-center bg-surface px-6">
      <Card
        mark="☰"
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

const pack: EmptyPack = { name: "Signpost", SignIn, TreeEmpty, DueEmpty, Unselected };
export default pack;
export { HOUSEHOLD_EMAIL };
