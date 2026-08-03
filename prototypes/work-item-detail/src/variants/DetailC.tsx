// PROTOTYPE — Variant C: "Workbench".
// Action-first. The question this view answers is "what do I do about this thing", so
// the top of the screen is a status action bar sized for a thumb, the middle is the
// children — what is actually left — and the bottom is a comment thread with a pinned
// composer, chat-shaped. The core fields are not the point: they collapse into one
// disclosure. Nothing confirms; cascades happen and a toast says what moved, with Undo.
import { useState } from "react";
import { LABELS, PEOPLE, type Status } from "../data";
import { Avatar, DueCell, StatusIcon, TypeIcon } from "../screens";
import type { DetailProps } from "../shell";
import { terminal, unfinished, useTree } from "../store";

export default function DetailC({ id, compact, onOpen, onClose, onMove, requestCreate }: DetailProps) {
  const t = useTree();
  const item = t.byId(id);
  const kids = t.children(id);
  const [details, setDetails] = useState(false);
  const [more, setMore] = useState(false);
  const [comment, setComment] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showSettled, setShowSettled] = useState(false);
  const [desc, setDesc] = useState(false);

  const prog = t.progress(id);
  const settled = kids.filter(terminal);
  const shown = showSettled ? kids : kids.filter(unfinished);

  const act = (s: Status) => {
    const sweep = t.settlePreview(id);
    const wake = t.startPreview(id);
    t.setStatus(id, s);
    setMore(false);
    if (s === "In Progress" && wake.length) setToast(`Started — and ${wake.map((a) => a.summary).join(", ")}`);
    else if ((s === "Completed" || s === "Closed") && sweep.length)
      setToast(`${s} — and ${sweep.length} item${sweep.length === 1 ? "" : "s"} underneath`);
    else setToast(s);
  };

  const primary: { label: string; status: Status } | null =
    item.status === "Open"
      ? { label: "Start", status: "In Progress" }
      : item.status === "In Progress"
        ? { label: "Complete", status: "Completed" }
        : null;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1 px-2 py-1.5">
        <button onClick={onClose} className="touch-min rounded px-2 text-[13px] text-muted hover:bg-surface">
          {compact ? "←" : "✕"}
        </button>
        <nav className="min-w-0 flex-1 truncate text-[11px] text-faint">
          {t.ancestors(id).map((a) => (
            <button key={a.id} onClick={() => onOpen(a.id)} className="hover:text-primary hover:underline">
              {a.summary}
              <span className="px-1 text-line">›</span>
            </button>
          ))}
          <span className="inline-flex items-center gap-1 align-middle text-muted">
            <TypeIcon type={item.type} size={10} /> {item.type}
          </span>
        </nav>
      </div>

      <div className="shrink-0 px-4">
        <h1 className="text-[19px] leading-snug font-semibold">{item.summary}</h1>
      </div>

      {/* The action bar — the loudest thing on the screen. */}
      <div className="relative mt-3 flex shrink-0 items-center gap-2 px-4">
        {primary ? (
          <button
            onClick={() => act(primary.status)}
            className="touch-min flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-[14px] font-semibold text-primary-fg shadow-sm"
          >
            <StatusIcon status={primary.status} size={15} /> {primary.label}
          </button>
        ) : (
          <button
            onClick={() => act("Open")}
            className="touch-min flex flex-1 items-center justify-center gap-2 rounded-lg border border-line py-2.5 text-[14px] font-medium"
          >
            <StatusIcon status={item.status} size={15} /> {item.status} — reopen
          </button>
        )}
        <button
          onClick={() => setMore((v) => !v)}
          className="touch-min rounded-lg border border-line px-3 py-2.5 text-[14px] text-muted"
          aria-label="Other statuses"
        >
          ⋯
        </button>
        {more && (
          <div className="absolute top-full right-4 z-30 mt-1 w-48 rounded-lg border border-line bg-bg p-1 shadow-xl">
            {(["Open", "In Progress", "Completed", "Closed"] as Status[])
              .filter((s) => s !== item.status)
              .map((s) => (
                <button
                  key={s}
                  onClick={() => act(s)}
                  className="touch-min flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[13px] hover:bg-surface"
                >
                  <StatusIcon status={s} size={13} /> {s}
                </button>
              ))}
            {item.type !== "Topic" && (
              <button
                onClick={() => { setMore(false); onMove(id); }}
                className="touch-min mt-0.5 flex w-full items-center gap-2 rounded border-t border-line px-2 py-1 text-left text-[13px] hover:bg-surface"
              >
                ⇄ Move to another {t.ancestors(id).slice(-1)[0]?.type}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fields, deliberately demoted to a disclosure. */}
      <div className="mt-2 shrink-0 px-4">
        <button
          onClick={() => setDetails((v) => !v)}
          className="touch-min flex w-full items-center gap-2 rounded px-1 py-1 text-left text-[13px] text-muted hover:bg-surface"
        >
          <Avatar name={item.assignee} size={18} />
          <span>{item.assignee ?? "Unassigned"}</span>
          <span className="text-line">·</span>
          <DueCell due={item.due} settled={terminal(item)} />
          {item.labels.length > 0 && <span className="truncate text-[12px] text-faint">{item.labels.join(", ")}</span>}
          <span className="ml-auto text-[12px] text-faint">{details ? "hide" : "details"}</span>
        </button>
        {details && (
          <div className="mb-1 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 rounded border border-line bg-surface p-2 text-[13px]">
            <span className="text-faint">Assignee</span>
            <select
              value={item.assignee ?? ""}
              onChange={(e) => t.update(id, { assignee: e.target.value || null })}
              className="touch-min rounded border border-line bg-bg px-1.5 py-1"
            >
              <option value="">Unassigned</option>
              {PEOPLE.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <span className="text-faint">Due</span>
            <input
              type="date"
              value={item.due ?? ""}
              onChange={(e) => t.update(id, { due: e.target.value || null })}
              className="touch-min rounded border border-line bg-bg px-1.5 py-1"
            />
            <span className="text-faint">Labels</span>
            <div className="flex flex-wrap gap-1">
              {Object.keys(LABELS).map((l) => {
                const on = item.labels.includes(l);
                return (
                  <button
                    key={l}
                    onClick={() => t.update(id, { labels: on ? item.labels.filter((x) => x !== l) : [...item.labels, l] })}
                    className={`touch-min rounded border px-2 py-0.5 text-[12px] ${
                      on ? "border-primary bg-primary-soft text-primary" : "border-line bg-bg text-muted"
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* The body: what is left. Comments are pinned below, so this is the only scroller. */}
      <div className="mt-1 min-h-0 flex-1 overflow-y-auto border-t border-line">
        {item.description || desc ? (
          <div className="border-b border-line px-4 py-2">
            {desc ? (
              <textarea
                autoFocus
                defaultValue={item.description ?? ""}
                onBlur={(e) => { t.update(id, { description: e.target.value }); setDesc(false); }}
                rows={6}
                className="w-full rounded border border-primary p-2 text-[14px] outline-none"
              />
            ) : (
              <button onClick={() => setDesc(true)} className="w-full text-left text-[14px] leading-relaxed whitespace-pre-wrap text-muted">
                {item.description}
              </button>
            )}
          </div>
        ) : (
          <button onClick={() => setDesc(true)} className="touch-min block w-full border-b border-line px-4 py-2 text-left text-[13px] text-faint">
            Add notes…
          </button>
        )}

        {item.type !== "Subtask" && (
          <div className="px-4 pt-3">
            <div className="mb-1.5 flex items-baseline gap-2">
              <h2 className="text-[13px] font-semibold">What's left</h2>
              {prog.total > 0 && (
                <span className="text-[12px] text-faint tabular-nums">
                  {prog.done}/{prog.total} settled
                </span>
              )}
              <div className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-raised">
                <div
                  className="h-full bg-primary"
                  style={{ width: prog.total ? `${(prog.done / prog.total) * 100}%` : "0%" }}
                />
              </div>
            </div>
            <ul>
              {shown.map((c) => {
                const grand = t.progress(c.id);
                return (
                  <li key={c.id} className="flex items-center gap-2 border-b border-line py-2">
                    <button onClick={() => t.setStatus(c.id, c.status === "Completed" ? "Open" : "Completed")} className="touch-min px-0.5">
                      <StatusIcon status={c.status} size={16} />
                    </button>
                    <button onClick={() => onOpen(c.id)} className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-[14px]">{c.summary}</span>
                      {grand.total > 0 && (
                        <span className="text-[11px] text-faint tabular-nums">
                          {grand.done}/{grand.total} underneath
                        </span>
                      )}
                    </button>
                    <DueCell due={c.due} settled={terminal(c)} />
                    <Avatar name={c.assignee} size={18} />
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center gap-3 py-2">
              <button onClick={() => requestCreate(id)} className="touch-min text-[13px] text-primary hover:underline">
                + Add {item.type === "Topic" ? "Project" : item.type === "Project" ? "Task" : "Subtask"}
              </button>
              {settled.length > 0 && (
                <button onClick={() => setShowSettled((v) => !v)} className="touch-min text-[12px] text-faint hover:underline">
                  {showSettled ? "hide" : `${settled.length} settled — show`}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="px-4 pt-3 pb-3">
          <h2 className="mb-1.5 text-[13px] font-semibold">Thread</h2>
          {(item.comments ?? []).length === 0 && <p className="text-[13px] text-faint">Nothing said yet.</p>}
          {(item.comments ?? []).map((c, n) => {
            const mine = c.author === "Dave";
            return (
              <div key={n} className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-[14px] leading-relaxed ${
                    mine ? "bg-primary text-primary-fg" : "bg-raised"
                  }`}
                >
                  {!mine && <p className="mb-0.5 text-[11px] font-medium text-muted">{c.author}</p>}
                  <p className="whitespace-pre-wrap">{c.body}</p>
                  <p className={`mt-0.5 text-[10px] ${mine ? "text-primary-fg/70" : "text-faint"}`}>{c.at}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Composer pinned to the bottom — on compact it sits above the tab capsule. */}
      <div className={`shrink-0 border-t border-line bg-bg p-2 ${compact ? "pb-24" : ""}`}>
        <div className="flex items-end gap-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={1}
            placeholder="Say something…"
            className="min-h-10 flex-1 resize-none rounded-2xl border border-line px-3 py-2 text-[14px] outline-none focus:border-primary"
          />
          <button
            onClick={() => { if (comment.trim()) { t.addComment(id, comment.trim()); setComment(""); } }}
            disabled={!comment.trim()}
            className="touch-min rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-primary-fg disabled:opacity-35"
          >
            Send
          </button>
        </div>
      </div>

      {toast && (
        <div className="absolute inset-x-0 bottom-28 z-40 flex justify-center px-4">
          <div className="flex w-full max-w-[420px] items-center gap-3 rounded-lg bg-fg px-3 py-2 text-[13px] text-bg shadow-xl">
            <span className="min-w-0 flex-1 truncate">{toast}</span>
            {t.undo && (
              <button
                onClick={() => { t.undo?.(); setToast(null); }}
                className="shrink-0 font-semibold underline"
              >
                Undo
              </button>
            )}
            <button onClick={() => setToast(null)} className="shrink-0 text-bg/60">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
