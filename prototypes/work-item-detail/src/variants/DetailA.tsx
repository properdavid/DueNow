// PROTOTYPE — Variant A: "Document".
// One scrolling column, top to bottom: breadcrumb, summary, a wrapping strip of
// property chips, description, children, comments. There is no form and no edit mode —
// every field is the control, clicked in place, committed on the spot. A cascade is
// announced by a popover under the chip you are already touching, listing what it will
// sweep, before it happens.
import { useEffect, useRef, useState } from "react";
import { LABELS, PEOPLE, formatDue, type Status } from "../data";
import { Avatar, DueCell, StatusIcon, TypeIcon } from "../screens";
import type { DetailProps } from "../shell";
import { terminal, unfinished, useTree } from "../store";

const STATUSES: Status[] = ["Open", "In Progress", "Completed", "Closed"];

function Pop({ onClose, children, wide }: { onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", on));
    return () => document.removeEventListener("mousedown", on);
  }, [onClose]);
  return (
    <div
      ref={ref}
      className={`absolute top-full left-0 z-30 mt-1 rounded-lg border border-line bg-bg p-1.5 shadow-xl ${wide ? "w-72" : "w-56"}`}
    >
      {children}
    </div>
  );
}

const chip =
  "touch-min inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[13px] hover:border-faint";

/** Free text is the one thing here that is *composed* rather than picked, so it commits
 *  on an explicit ✓ rather than on blur — a half-written sentence should never be able to
 *  save itself by a stray tap elsewhere. Pickers stay instant. */
function ConfirmCancel({ onConfirm, onCancel, disabled }: {
  onConfirm: () => void; onCancel: () => void; disabled?: boolean;
}) {
  return (
    <div className="mt-1.5 flex gap-1.5">
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={onConfirm}
        disabled={disabled}
        aria-label="Confirm"
        className="flex h-7 w-7 items-center justify-center rounded border border-primary bg-primary text-[13px] text-primary-fg disabled:opacity-35"
      >
        ✓
      </button>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={onCancel}
        aria-label="Discard"
        className="flex h-7 w-7 items-center justify-center rounded border border-line text-[13px] text-muted hover:bg-surface"
      >
        ✕
      </button>
    </div>
  );
}

export default function DetailA({ id, compact, onOpen, onClose, onMove, requestCreate }: DetailProps) {
  const t = useTree();
  const item = t.byId(id);
  const kids = t.children(id);
  const [open, setOpen] = useState<null | "status" | "assignee" | "due" | "labels">(null);
  const [editing, setEditing] = useState<null | "summary" | "description">(null);
  const [draft, setDraft] = useState("");
  const [confirm, setConfirm] = useState<Status | null>(null);
  const [comment, setComment] = useState("");
  const [showSettled, setShowSettled] = useState(false);

  const settled = kids.filter(terminal);
  const shown = showSettled ? kids : kids.filter(unfinished);
  const sweep = confirm ? t.settlePreview(id) : [];
  const wake = t.startPreview(id);

  const pickStatus = (s: Status) => {
    if ((s === "Completed" || s === "Closed") && t.settlePreview(id).length > 0) {
      setConfirm(s);
      return;
    }
    t.setStatus(id, s);
    setOpen(null);
  };

  return (
    <div className={`flex h-full flex-col ${compact ? "" : "min-h-0"}`}>
      <div className="flex shrink-0 items-center gap-1 border-b border-line px-2 py-1.5">
        <button onClick={onClose} className="touch-min rounded px-2 text-[13px] text-muted hover:bg-surface">
          {compact ? "←" : "✕"}
        </button>
        <nav className="min-w-0 flex-1 truncate text-[12px] text-faint">
          {t.ancestors(id).map((a) => (
            <button key={a.id} onClick={() => onOpen(a.id)} className="hover:text-primary hover:underline">
              {a.summary}
              <span className="px-1 text-line">›</span>
            </button>
          ))}
          <span className="inline-flex items-center gap-1 align-middle text-muted">
            <TypeIcon type={item.type} size={11} /> {item.type}
          </span>
        </nav>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-32">
        <div className={compact ? "px-4 pt-4" : "mx-auto max-w-[720px] px-8 pt-6"}>
          {editing === "summary" ? (
            <div>
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditing(null);
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (draft.trim()) t.update(id, { summary: draft.trim() });
                    setEditing(null);
                  }
                }}
                rows={2}
                className="w-full resize-none rounded border border-primary px-2 py-1 text-[22px] leading-tight font-semibold outline-none"
              />
              <ConfirmCancel
                disabled={!draft.trim()}
                onConfirm={() => { t.update(id, { summary: draft.trim() }); setEditing(null); }}
                onCancel={() => setEditing(null)}
              />
            </div>
          ) : (
            <h1
              onClick={() => {
                setDraft(item.summary);
                setEditing("summary");
              }}
              className="-mx-2 cursor-text rounded px-2 py-1 text-[22px] leading-tight font-semibold hover:bg-surface"
            >
              {item.summary}
            </h1>
          )}

          {/* The property strip: no labels, no rows — the value is the control. */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="relative">
              <button onClick={() => setOpen(open === "status" ? null : "status")} className={chip}>
                <StatusIcon status={item.status} size={13} />
                {item.status}
              </button>
              {open === "status" && (
                <Pop onClose={() => { setOpen(null); setConfirm(null); }} wide={!!confirm}>
                  {confirm ? (
                    <div className="p-1.5">
                      <p className="mb-1 text-[13px] font-semibold">
                        {confirm === "Completed" ? "Complete" : "Close"} {sweep.length} more?
                      </p>
                      <p className="mb-2 text-[12px] text-muted">
                        Everything unfinished underneath takes the same status.
                      </p>
                      <ul className="mb-2 max-h-40 overflow-y-auto rounded border border-line bg-surface p-1">
                        {sweep.map((d) => (
                          <li key={d.id} className="flex items-center gap-1.5 px-1 py-0.5 text-[12px]">
                            <TypeIcon type={d.type} size={10} />
                            <span className="truncate">{d.summary}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setConfirm(null)} className="touch-min rounded border border-line px-2 text-[12px]">
                          Cancel
                        </button>
                        <button
                          onClick={() => { t.setStatus(id, confirm); setConfirm(null); setOpen(null); }}
                          className="touch-min rounded bg-primary px-2 text-[12px] font-medium text-primary-fg"
                        >
                          {confirm === "Completed" ? "Complete all" : "Close all"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => pickStatus(s)}
                          className={`touch-min flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[13px] hover:bg-surface ${
                            s === item.status ? "font-semibold text-primary" : ""
                          }`}
                        >
                          <StatusIcon status={s} size={13} /> {s}
                        </button>
                      ))}
                      {item.status === "Open" && wake.length > 0 && (
                        <p className="border-t border-line px-2 pt-1.5 pb-1 text-[11px] text-faint">
                          Starting this also starts {wake.map((a) => a.summary).join(", ")}.
                        </p>
                      )}
                    </>
                  )}
                </Pop>
              )}
            </span>

            <span className="relative">
              <button onClick={() => setOpen(open === "assignee" ? null : "assignee")} className={chip}>
                <Avatar name={item.assignee} size={17} />
                {item.assignee ?? "Unassigned"}
              </button>
              {open === "assignee" && (
                <Pop onClose={() => setOpen(null)}>
                  {[null, ...PEOPLE].map((p) => (
                    <button
                      key={p ?? "none"}
                      onClick={() => { t.update(id, { assignee: p }); setOpen(null); }}
                      className="touch-min flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[13px] hover:bg-surface"
                    >
                      <Avatar name={p} size={17} /> {p ?? "Unassigned"}
                    </button>
                  ))}
                </Pop>
              )}
            </span>

            <span className="relative">
              <button onClick={() => setOpen(open === "due" ? null : "due")} className={chip}>
                <span className="text-faint">◷</span>
                <DueCell due={item.due} settled={terminal(item)} />
              </button>
              {open === "due" && (
                <Pop onClose={() => setOpen(null)}>
                  <input
                    type="date"
                    autoFocus
                    value={item.due ?? ""}
                    onChange={(e) => { t.update(id, { due: e.target.value || null }); setOpen(null); }}
                    className="touch-min w-full rounded border border-line px-2 text-[13px]"
                  />
                  <button
                    onClick={() => { t.update(id, { due: null }); setOpen(null); }}
                    className="touch-min mt-1 w-full rounded px-2 text-left text-[13px] text-muted hover:bg-surface"
                  >
                    No due date
                  </button>
                </Pop>
              )}
            </span>

            <span className="relative">
              <button onClick={() => setOpen(open === "labels" ? null : "labels")} className={chip}>
                {item.labels.length ? item.labels.join(", ") : <span className="text-faint">+ label</span>}
              </button>
              {open === "labels" && (
                <Pop onClose={() => setOpen(null)}>
                  {Object.keys(LABELS).map((l) => {
                    const on = item.labels.includes(l);
                    return (
                      <button
                        key={l}
                        onClick={() =>
                          t.update(id, { labels: on ? item.labels.filter((x) => x !== l) : [...item.labels, l] })
                        }
                        className="touch-min flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[13px] hover:bg-surface"
                      >
                        <span className={`h-3 w-3 rounded-sm border ${on ? "border-primary bg-primary" : "border-line"}`} />
                        {l}
                      </button>
                    );
                  })}
                </Pop>
              )}
            </span>

            {item.type !== "Topic" && (
              <button onClick={() => onMove(id)} className={`${chip} text-muted`}>
                ⇄ Move
              </button>
            )}
          </div>

          {/* Description reads as prose until you click it. */}
          <div className="mt-5">
            {editing === "description" ? (
              <div>
                <textarea
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                  rows={8}
                  className="w-full rounded border border-primary p-2 text-[15px] leading-relaxed outline-none"
                />
                <ConfirmCancel
                  onConfirm={() => { t.update(id, { description: draft }); setEditing(null); }}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : (
              <div
                onClick={() => { setDraft(item.description ?? ""); setEditing("description"); }}
                className="-mx-2 cursor-text rounded px-2 py-1 text-[15px] leading-relaxed whitespace-pre-wrap hover:bg-surface"
              >
                {item.description || <span className="text-faint">Add a description…</span>}
              </div>
            )}
          </div>

          {/* Children, as part of the document rather than a panel. */}
          {(kids.length > 0 || item.type !== "Subtask") && (
            <section className="mt-7">
              <h2 className="mb-1 text-[12px] font-semibold tracking-wide text-faint uppercase">
                {item.type === "Topic" ? "Projects" : item.type === "Project" ? "Tasks" : "Subtasks"}
                {kids.length > 0 && <span className="ml-1.5 font-normal">{kids.filter(terminal).length}/{kids.length}</span>}
              </h2>
              <ul>
                {shown.map((c) => (
                  <li key={c.id} className="group flex items-center gap-2 border-b border-line py-1.5">
                    <button
                      onClick={() => t.setStatus(c.id, c.status === "Completed" ? "Open" : "Completed")}
                      aria-label="Toggle complete"
                      className="touch-min px-0.5"
                    >
                      <StatusIcon status={c.status} size={15} />
                    </button>
                    <button onClick={() => onOpen(c.id)} className="min-w-0 flex-1 truncate text-left text-[14px] hover:text-primary">
                      {c.summary}
                    </button>
                    <span className="shrink-0 text-[12px] text-faint tabular-nums">{formatDue(c.due)}</span>
                    <Avatar name={c.assignee} size={18} />
                  </li>
                ))}
              </ul>
              <div className="mt-1.5 flex items-center gap-3">
                {item.type !== "Subtask" && (
                  <button onClick={() => requestCreate(id)} className="touch-min text-[13px] text-primary hover:underline">
                    + Add {item.type === "Topic" ? "Project" : item.type === "Project" ? "Task" : "Subtask"}
                  </button>
                )}
                {settled.length > 0 && (
                  <button onClick={() => setShowSettled((v) => !v)} className="touch-min text-[12px] text-faint hover:underline">
                    {showSettled ? "hide" : `${settled.length} settled — show`}
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Comments end the document. */}
          <section className="mt-8">
            <h2 className="mb-2 text-[12px] font-semibold tracking-wide text-faint uppercase">
              Comments {item.comments?.length ? item.comments.length : ""}
            </h2>
            {(item.comments ?? []).map((c, n) => (
              <div key={n} className="mb-4 flex gap-2.5">
                <Avatar name={c.author} size={24} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-faint">
                    <span className="font-medium text-fg">{c.author}</span> · {c.at}
                  </p>
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{c.body}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-2.5">
              <Avatar name="Dave" size={24} />
              <div className="min-w-0 flex-1">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setComment("")}
                  rows={comment ? 3 : 1}
                  placeholder="Write a comment…"
                  className="w-full resize-none rounded border border-line px-2 py-1.5 text-[14px] outline-none focus:border-primary"
                />
                {comment && (
                  <ConfirmCancel
                    disabled={!comment.trim()}
                    onConfirm={() => { t.addComment(id, comment.trim()); setComment(""); }}
                    onCancel={() => setComment("")}
                  />
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
