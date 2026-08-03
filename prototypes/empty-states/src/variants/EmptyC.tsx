// PROTOTYPE — Variant C: "Working".
// The empty space is not decorated and not left blank — it is given a job. First Run
// puts a live composer where the first row would be, so the first Topic is typed into
// the tree rather than into a dialog. A clear radar reports the fact just past the
// horizon instead of announcing its own emptiness. The unselected split column runs a
// standing "next up" list, so the pane is never dead.
//
// Two knowing tensions, which are the point of building it:
//   * ADR-0017/ADR-0018 give creation exactly one entry point — the Creation Dialog.
//     The composer is a second one, reachable only once in a deployment's lifetime.
//   * ADR-0024 forbids seeded content. The suggestion chips therefore *type into the
//     box*; nothing is inserted until Enter, so nothing is ever bolted to the floor.
import { useState } from "react";
import { absolute, relative } from "../due";
import type { DueEmptyProps, EmptyPack, SignInProps, TreeEmptyProps, UnselectedProps } from "../empty";
import { Avatar, StatusIcon, TypeIcon } from "../screens";

const SUGGESTIONS = ["House", "Travel", "Cleaning", "Celebrations"];

function SignIn({ rejected, email, onSignIn, onRetry }: SignInProps) {
  return (
    <div className="flex h-full items-center justify-center bg-surface px-5">
      <div className="w-full max-w-[420px] overflow-hidden rounded-xl border border-line bg-bg shadow-sm">
        <div className="border-b border-line bg-surface px-6 py-5">
          <p className="text-[18px] font-semibold tracking-tight text-primary">DueNow</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            This copy belongs to one household and runs on its own box. Signing in is Google's job; who is
            allowed in is the household's, and it is set where the app is deployed.
          </p>
        </div>
        {rejected ? (
          <div className="px-6 py-6">
            <p className="text-[13px] text-muted">Signed in to Google as</p>
            <p className="mt-1 font-mono text-[15px] font-medium break-all">{email}</p>
            <p className="mt-3 text-[13px] leading-relaxed">
              That address isn't on this household's list, so there is nothing here to open. Whoever runs this
              DueNow can add it — there is no request to send and no page to wait on.
            </p>
            <button
              onClick={onRetry}
              className="touch-min mt-5 w-full rounded-full border border-line py-2 text-[13px] font-medium hover:bg-surface"
            >
              Sign in as someone else
            </button>
          </div>
        ) : (
          <div className="px-6 py-6">
            <button
              onClick={onSignIn}
              className="touch-min flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-[14px] font-medium text-primary-fg shadow-sm"
            >
              <span className="text-[16px]">G</span> Continue with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TreeEmpty({ firstRun, settled, onReveal, onCreateTopic, onCreate }: TreeEmptyProps) {
  const [draft, setDraft] = useState("");

  if (!firstRun) {
    return (
      <ul className="border-t border-line">
        <li className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-line px-3 py-2.5 text-[13px]">
          <span className="font-medium">Nothing unfinished.</span>
          {settled > 0 && (
            <span className="text-muted">
              {settled} {settled === 1 ? "item is" : "items are"} settled —{" "}
              <button onClick={onReveal} className="text-primary hover:underline">
                show them
              </button>
            </span>
          )}
          <button onClick={onCreate} className="ml-auto text-[12px] text-primary hover:underline">
            + New work item
          </button>
        </li>
      </ul>
    );
  }

  return (
    <div className="border-t border-line">
      {/* A row-shaped composer: same height, same indent, same type icon as a real Topic row. */}
      <div className="flex items-center gap-1.5 border-b border-line py-1 pr-2 pl-[6px]">
        <span className="w-5 shrink-0" />
        <TypeIcon type="Topic" size={12} />
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              onCreateTopic(draft.trim());
              setDraft("");
            }
          }}
          placeholder="Name your first Topic, then press Enter"
          className="touch-min min-w-0 flex-1 bg-transparent py-1 text-[14px] font-semibold outline-none placeholder:font-normal placeholder:text-faint"
        />
      </div>
      <div className="px-3 py-3">
        <p className="text-[12px] text-muted">
          A Topic is a standing area of household life — it never has to finish. Everything else hangs off one.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setDraft(s)}
              className="touch-min rounded-full border border-line px-2.5 py-1 text-[12px] text-muted hover:bg-surface"
            >
              {s}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-faint">Nothing is created until you press Enter.</p>
      </div>
    </div>
  );
}

function DueEmpty({ firstRun, next, onOpen, onCreate }: DueEmptyProps) {
  if (firstRun) {
    return (
      <div className="px-4 py-5">
        <p className="text-[14px] font-medium">Nothing is dated yet.</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          Give a work item a due date and it lands in one of these three:
        </p>
        <ul className="mt-3 flex flex-col gap-1.5">
          {[
            ["Due Now", "today or overdue"],
            ["Due Soon", "the next 7 days"],
            ["Due Later", "the 23 days after that"],
          ].map(([t, w]) => (
            <li key={t} className="flex items-baseline gap-2 rounded-lg border border-dashed border-line px-3 py-2">
              <span className="text-[13px] font-semibold">{t}</span>
              <span className="text-[12px] text-faint">{w}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={onCreate}
          className="touch-min mt-4 rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-primary-fg"
        >
          New work item
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-5">
      <p className="text-[14px] font-medium">Nothing due in the next 30 days.</p>
      {next ? (
        <>
          <p className="mt-1 text-[13px] text-muted">The next dated work is {relative(next.days)}:</p>
          <button
            onClick={() => onOpen(next.item.id)}
            className="touch-min mt-2 flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-left hover:bg-surface"
          >
            <TypeIcon type={next.item.type} size={12} />
            <span className="min-w-0 flex-1 truncate text-[13px]">{next.item.summary}</span>
            <span className="shrink-0 text-[12px] text-faint">{absolute(next.item.due!)}</span>
          </button>
        </>
      ) : (
        <p className="mt-1 text-[13px] text-muted">Nothing in the tree carries a due date at all.</p>
      )}
    </div>
  );
}

function Unselected({ rows, firstRun, onOpen, onCreate }: UnselectedProps) {
  if (firstRun) {
    return (
      <div className="flex h-full flex-col justify-center bg-surface px-8">
        <p className="text-[14px] font-medium">Nothing to show here yet.</p>
        <p className="mt-1 max-w-[320px] text-[13px] leading-relaxed text-muted">
          This column holds whichever work item you pick on the left. Create the first one and it opens here.
        </p>
        <button onClick={onCreate} className="mt-3 self-start text-[13px] text-primary hover:underline">
          New work item
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-surface px-5 py-5">
      <p className="text-[12px] tracking-wide text-faint uppercase">Next up</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-[13px] text-muted">Nothing is due in the next 30 days.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {rows.slice(0, 5).map((r) => (
            <li key={r.item.id}>
              <button
                onClick={() => onOpen(r.item.id)}
                className="flex w-full items-center gap-2 rounded-lg border border-line bg-bg px-3 py-2 text-left hover:border-faint"
              >
                <StatusIcon status={r.item.status} size={12} />
                <span className="min-w-0 flex-1 truncate text-[13px]">{r.item.summary}</span>
                <span className={`shrink-0 text-[12px] ${r.overdue ? "text-overdue" : "text-faint"}`}>
                  {relative(r.days)}
                </span>
                <Avatar name={r.item.assignee} size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-[12px] text-faint">Pick anything on the left to open it here.</p>
    </div>
  );
}

const pack: EmptyPack = { name: "Working", SignIn, TreeEmpty, DueEmpty, Unselected };
export default pack;
