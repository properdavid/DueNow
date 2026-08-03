// PROTOTYPE — Variant B: "Record".
// The work item as a record with a form, not a document. Fields live in their own
// labelled rail — a right-hand column when split, a collapsed summary bar that opens a
// sheet when compact — and nothing commits until you Save, so a mistyped date is
// recoverable. The body is *tabbed* (Description / Children / Comments) so the phone
// never scrolls past three surfaces to reach the third. A cascade is a modal you must
// read before it happens.
import { useEffect, useState } from "react";
import { LABELS, PEOPLE, type Status } from "../data";
import { Avatar, DueCell, StatusBadge, StatusIcon, TypeIcon } from "../screens";
import type { DetailProps } from "../shell";
import { terminal, unfinished, useTree } from "../store";

const STATUSES: Status[] = ["Open", "In Progress", "Completed", "Closed"];
type BodyTab = "description" | "children" | "comments";

export default function DetailB({ id, compact, onOpen, onClose, onMove, requestCreate }: DetailProps) {
  const t = useTree();
  const item = t.byId(id);
  const kids = t.children(id);

  const [tab, setTab] = useState<BodyTab>("description");
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState<Status | null>(null);
  const [comment, setComment] = useState("");
  const [showSettled, setShowSettled] = useState(false);

  // The form is a draft over the record — Save commits, Cancel throws away.
  const [dirty, setDirty] = useState(false);
  const [form, setForm] = useState({
    summary: item.summary,
    description: item.description ?? "",
    status: item.status,
    assignee: item.assignee ?? "",
    due: item.due ?? "",
    labels: item.labels,
  });
  useEffect(() => {
    setForm({
      summary: item.summary,
      description: item.description ?? "",
      status: item.status,
      assignee: item.assignee ?? "",
      due: item.due ?? "",
      labels: item.labels,
    });
    setDirty(false);
    setTab("description");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const set = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };

  const save = () => {
    const statusChanged = form.status !== item.status;
    t.update(id, {
      summary: form.summary.trim() || item.summary,
      description: form.description,
      assignee: form.assignee || null,
      due: form.due || null,
      labels: form.labels,
    });
    if (statusChanged) {
      if ((form.status === "Completed" || form.status === "Closed") && t.settlePreview(id).length > 0) {
        setConfirm(form.status);
        return;
      }
      t.setStatus(id, form.status);
    }
    setDirty(false);
    setSheet(false);
  };

  const cancel = () => {
    setForm({
      summary: item.summary,
      description: item.description ?? "",
      status: item.status,
      assignee: item.assignee ?? "",
      due: item.due ?? "",
      labels: item.labels,
    });
    setDirty(false);
    setSheet(false);
  };

  const input = "w-full rounded border border-line bg-bg px-2 py-1.5 text-[13px] outline-none focus:border-primary";
  const settled = kids.filter(terminal);
  const shown = showSettled ? kids : kids.filter(unfinished);
  const sweep = confirm ? t.settlePreview(id) : [];
  const wake = t.startPreview(id);

  const Rail = (
    <div className="text-[13px]">
      <div className="mb-3">
        <span className="mb-1 block text-[11px] font-semibold tracking-wide text-faint uppercase">Status</span>
        <select value={form.status} onChange={(e) => set({ status: e.target.value as Status })} className={`touch-min ${input}`}>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        {form.status === "In Progress" && item.status === "Open" && wake.length > 0 && (
          <p className="mt-1 text-[11px] text-muted">Also starts {wake.map((a) => a.summary).join(", ")}.</p>
        )}
        {(form.status === "Completed" || form.status === "Closed") && t.settlePreview(id).length > 0 && (
          <p className="mt-1 text-[11px] text-muted">
            Also settles {t.settlePreview(id).length} item{t.settlePreview(id).length === 1 ? "" : "s"} underneath.
          </p>
        )}
      </div>

      <div className="mb-3">
        <span className="mb-1 block text-[11px] font-semibold tracking-wide text-faint uppercase">Assignee</span>
        <select value={form.assignee} onChange={(e) => set({ assignee: e.target.value })} className={`touch-min ${input}`}>
          <option value="">Unassigned</option>
          {PEOPLE.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <span className="mb-1 block text-[11px] font-semibold tracking-wide text-faint uppercase">Due date</span>
        <input type="date" value={form.due} onChange={(e) => set({ due: e.target.value })} className={`touch-min ${input}`} />
      </div>

      <div className="mb-3">
        <span className="mb-1 block text-[11px] font-semibold tracking-wide text-faint uppercase">Labels</span>
        <div className="flex flex-wrap gap-1">
          {Object.keys(LABELS).map((l) => {
            const on = form.labels.includes(l);
            return (
              <button
                key={l}
                onClick={() => set({ labels: on ? form.labels.filter((x) => x !== l) : [...form.labels, l] })}
                className={`touch-min rounded border px-2 py-0.5 text-[12px] ${
                  on ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface text-muted"
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-3">
        <span className="mb-1 block text-[11px] font-semibold tracking-wide text-faint uppercase">Type</span>
        <p className="flex items-center gap-1.5 text-muted">
          <TypeIcon type={item.type} size={12} /> {item.type}
          <span className="text-faint">— fixed</span>
        </p>
      </div>

      <div className="mb-3">
        <span className="mb-1 block text-[11px] font-semibold tracking-wide text-faint uppercase">Parent</span>
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-muted">
            {item.parentId ? t.byId(item.parentId).summary : "— a Topic has no parent"}
          </span>
          {item.type !== "Topic" && (
            <button onClick={() => onMove(id)} className="touch-min rounded border border-line px-2 py-0.5 text-[12px] hover:bg-surface">
              Move
            </button>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 flex gap-2 border-t border-line bg-bg pt-2">
        <button
          onClick={save}
          disabled={!dirty}
          className="touch-min flex-1 rounded bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-fg disabled:opacity-35"
        >
          Save
        </button>
        <button
          onClick={cancel}
          disabled={!dirty}
          className="touch-min rounded border border-line px-3 py-1.5 text-[13px] disabled:opacity-35"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const Tabs = (
    <div className="flex shrink-0 gap-0.5 border-b border-line px-3">
      {(
        [
          ["description", "Description"],
          ["children", `${item.type === "Topic" ? "Projects" : item.type === "Project" ? "Tasks" : "Subtasks"} ${kids.length || ""}`],
          ["comments", `Comments ${item.comments?.length ?? 0}`],
        ] as const
      ).map(([k, lbl]) => (
        <button
          key={k}
          onClick={() => setTab(k as BodyTab)}
          className={`touch-min border-b-2 px-3 py-1.5 text-[13px] ${
            tab === k ? "border-primary font-medium text-primary" : "border-transparent text-muted hover:text-fg"
          }`}
        >
          {lbl}
        </button>
      ))}
    </div>
  );

  const Body = (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {tab === "description" && (
        <div className="p-3">
          <textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={compact ? 10 : 16}
            placeholder="Markdown"
            className="w-full rounded border border-line p-2 text-[14px] leading-relaxed outline-none focus:border-primary"
          />
          <p className="mt-1 text-[11px] text-faint">Edits are held until you Save.</p>
        </div>
      )}

      {tab === "children" && (
        <div>
          {kids.length === 0 && <p className="p-3 text-[13px] text-faint">Nothing underneath yet.</p>}
          <table className="w-full text-[13px]">
            <tbody>
              {shown.map((c) => (
                <tr key={c.id} className="border-b border-line hover:bg-surface">
                  <td className="w-6 pl-3">
                    <StatusIcon status={c.status} size={13} />
                  </td>
                  <td className="py-2">
                    <button onClick={() => onOpen(c.id)} className="block max-w-full truncate text-left hover:text-primary">
                      {c.summary}
                    </button>
                  </td>
                  <td className="w-24 text-right">
                    <StatusBadge status={c.status} short />
                  </td>
                  <td className="w-20 pr-2 text-right">
                    <DueCell due={c.due} settled={terminal(c)} />
                  </td>
                  <td className="w-9 pr-3 text-right">
                    <Avatar name={c.assignee} size={18} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-3 p-3">
            {item.type !== "Subtask" && (
              <button
                onClick={() => requestCreate(id)}
                className="touch-min rounded border border-line px-2 py-1 text-[13px] hover:bg-surface"
              >
                + Add {item.type === "Topic" ? "Project" : item.type === "Project" ? "Task" : "Subtask"}
              </button>
            )}
            {settled.length > 0 && (
              <button onClick={() => setShowSettled((v) => !v)} className="touch-min text-[12px] text-faint hover:underline">
                {showSettled ? "hide settled" : `${settled.length} settled — show`}
              </button>
            )}
          </div>
        </div>
      )}

      {tab === "comments" && (
        <div className="p-3">
          {(item.comments ?? []).length === 0 && <p className="mb-3 text-[13px] text-faint">No comments.</p>}
          {(item.comments ?? []).map((c, n) => (
            <div key={n} className="mb-2 rounded border border-line bg-surface p-2">
              <p className="mb-1 text-[11px] text-faint">
                <span className="font-medium text-fg">{c.author}</span> · {c.at}
              </p>
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Write a comment…"
            className="mt-2 w-full rounded border border-line p-2 text-[13px] outline-none focus:border-primary"
          />
          <button
            onClick={() => { if (comment.trim()) { t.addComment(id, comment.trim()); setComment(""); } }}
            disabled={!comment.trim()}
            className="touch-min mt-1.5 rounded bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-fg disabled:opacity-35"
          >
            Comment
          </button>
        </div>
      )}
    </div>
  );

  const CascadeModal = confirm && (
    <>
      <div className="absolute inset-0 z-40 bg-black/30" />
      <div className="absolute top-1/2 left-1/2 z-50 w-[min(440px,90%)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line bg-bg p-4 shadow-2xl">
        <h2 className="mb-1 text-[15px] font-semibold">
          {confirm === "Completed" ? "Complete" : "Close"} {sweep.length + 1} work items?
        </h2>
        <p className="mb-3 text-[13px] text-muted">
          A settled work item never has unfinished work underneath it, so these take “{confirm}” too.
        </p>
        <ul className="mb-3 max-h-56 overflow-y-auto rounded border border-line bg-surface p-1.5">
          {sweep.map((d) => (
            <li key={d.id} className="flex items-center gap-2 px-1 py-1 text-[13px]">
              <TypeIcon type={d.type} size={11} />
              <span className="min-w-0 flex-1 truncate">{d.summary}</span>
              <StatusBadge status={d.status} short />
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => { setConfirm(null); setForm((f) => ({ ...f, status: item.status })); }}
            className="touch-min rounded border border-line px-3 py-1.5 text-[13px]"
          >
            Cancel
          </button>
          <button
            onClick={() => { t.setStatus(id, confirm); setConfirm(null); setDirty(false); setSheet(false); }}
            className="touch-min rounded bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-fg"
          >
            Yes, {confirm === "Completed" ? "complete" : "close"} all
          </button>
        </div>
      </div>
    </>
  );

  const Header = (
    <div className="shrink-0 border-b border-line px-3 py-2">
      <div className="flex items-start gap-2">
        <button onClick={onClose} className="touch-min -ml-1 rounded px-2 text-[13px] text-muted hover:bg-surface">
          {compact ? "←" : "✕"}
        </button>
        <div className="min-w-0 flex-1">
          <nav className="truncate text-[11px] text-faint">
            {t.ancestors(id).map((a) => (
              <button key={a.id} onClick={() => onOpen(a.id)} className="hover:text-primary hover:underline">
                {a.summary}
                <span className="px-1 text-line">›</span>
              </button>
            ))}
            <span className="text-muted">{item.type} #{item.id}</span>
          </nav>
          <input
            value={form.summary}
            onChange={(e) => set({ summary: e.target.value })}
            className="mt-0.5 w-full rounded border border-transparent bg-transparent text-[16px] leading-snug font-semibold outline-none hover:border-line focus:border-primary"
          />
        </div>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className="relative flex h-full flex-col">
        {Header}
        {/* The rail collapses to one line; tapping it opens the form as a sheet. */}
        <button
          onClick={() => setSheet(true)}
          className="touch-min flex shrink-0 items-center gap-2 border-b border-line bg-surface px-3 py-2 text-left text-[13px]"
        >
          <StatusBadge status={item.status} />
          <Avatar name={item.assignee} size={18} />
          <DueCell due={item.due} settled={terminal(item)} />
          {item.labels.length > 0 && <span className="truncate text-[12px] text-faint">{item.labels.join(", ")}</span>}
          <span className="ml-auto text-[12px] text-primary">Edit fields</span>
        </button>
        {Tabs}
        {Body}
        {dirty && !sheet && (
          <div className="flex shrink-0 gap-2 border-t border-line bg-bg p-2 pb-24">
            <button onClick={save} className="touch-min flex-1 rounded bg-primary py-2 text-[13px] font-medium text-primary-fg">
              Save changes
            </button>
            <button onClick={cancel} className="touch-min rounded border border-line px-3 text-[13px]">
              Cancel
            </button>
          </div>
        )}
        {!dirty && <div className="h-20 shrink-0" />}
        {sheet && (
          <>
            <div onClick={() => setSheet(false)} className="absolute inset-0 z-40 bg-black/25" />
            <div className="absolute inset-x-0 bottom-0 z-50 max-h-[85%] overflow-y-auto rounded-t-xl border-t border-line bg-bg p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15px] font-semibold">Fields</h2>
                <button onClick={() => setSheet(false)} className="touch-min rounded px-2 text-muted">✕</button>
              </div>
              {Rail}
            </div>
          </>
        )}
        {CascadeModal}
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {Header}
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          {Tabs}
          {Body}
        </div>
        <aside className="w-[280px] shrink-0 overflow-y-auto border-l border-line bg-surface p-3">{Rail}</aside>
      </div>
      {CascadeModal}
    </div>
  );
}
