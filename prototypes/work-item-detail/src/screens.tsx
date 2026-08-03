// PROTOTYPE — throwaway. Shared *atoms* and the non-tree surfaces, so the tree is
// judged inside a populated app rather than in a vacuum. The three variants share
// none of their own layout.
import { useState } from "react";
import { LABELS, ME, PEOPLE, TODAY, daysOut, formatDue, type Status, type Type, type WorkItem } from "./data";
import { unfinished, useTree } from "./store";

const statusTone: Record<Status, string> = {
  Open: "text-open border-line",
  "In Progress": "text-progress border-progress/30",
  Completed: "text-completed border-completed/30",
  Closed: "text-closed border-line",
};

export function StatusBadge({ status, short }: { status: Status; short?: boolean }) {
  return (
    <span className={`shrink-0 rounded border px-1.5 py-px text-[10px] font-semibold tracking-wider uppercase ${statusTone[status]}`}>
      {status === "In Progress" ? (short ? "WIP" : "In prog") : status}
    </span>
  );
}

/** Status owns the circle and the blue: empty grey = Open, half blue = In Progress,
 *  full blue = Completed, full grey = Closed. Fill carries "how far", hue carries
 *  "achieved or not". */
export function StatusIcon({ status, size = 14 }: { status: Status; size?: number }) {
  const stroke = {
    Open: "var(--color-open)",
    "In Progress": "var(--color-progress)",
    Completed: "var(--color-completed)",
    Closed: "var(--color-closed)",
  }[status];
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} role="img" aria-label={status} className="shrink-0">
      <title>{status}</title>
      {status === "Completed" ? (
        // Achieved gets its own mark, not a fuller circle — shape, not shade.
        <path d="M3 8.6 6.4 12 13 4.6" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <>
          <circle cx="8" cy="8" r="6" fill={status === "Closed" ? stroke : "none"} stroke={stroke} strokeWidth="1.6" />
          {status === "In Progress" && <path d="M8 2a6 6 0 0 1 0 12Z" fill={stroke} />}
        </>
      )}
    </svg>
  );
}

export function Labels({ labels }: { labels: string[] }) {
  if (!labels.length) return null;
  return (
    <span className="flex shrink-0 gap-1">
      {labels.map((l) => (
        <span key={l} className="rounded border border-line bg-surface px-1.5 py-px text-[11px] text-muted">{l}</span>
      ))}
    </span>
  );
}

export function Avatar({ name, size = 20 }: { name: string | null; size?: number }) {
  if (!name)
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-faint text-[10px] text-faint"
        style={{ width: size, height: size }}
        title="Unassigned"
      >
        ?
      </span>
    );
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft text-[10px] font-semibold text-primary"
      style={{ width: size, height: size }}
      title={name}
    >
      {name[0]}
    </span>
  );
}

export function DueCell({ due, settled }: { due: string | null; settled?: boolean }) {
  // Overdue is defined as *unfinished* and past — a settled item is never overdue.
  const overdue = !settled && due != null && due < TODAY;
  return <span className={`shrink-0 tabular-nums ${overdue ? "font-medium text-overdue" : "text-muted"}`}>{formatDue(due)}</span>;
}

/** Type owns shape and hue — and never a circle, never blue, both of which belong to
 *  status. Shape is redundant with hue so the ladder still reads in greyscale. */
const TYPE_SHAPE: Record<Type, { d: string; color: string; label: string }> = {
  Topic: { color: "var(--color-type-topic)", label: "Topic (star)", d: "M8 1.4l1.9 4 4.4.6-3.2 3.1.8 4.4L8 11.4l-3.9 2.1.8-4.4L1.7 6l4.4-.6z" },
  Project: { color: "var(--color-type-project)", label: "Project (diamond)", d: "M8 1.6 14.4 8 8 14.4 1.6 8z" },
  Task: { color: "var(--color-type-task)", label: "Task (square)", d: "M2.6 2.6h10.8v10.8H2.6z" },
  Subtask: { color: "var(--color-type-subtask)", label: "Subtask (triangle)", d: "M8 2.2 14.2 13.4H1.8z" },
};

export function TypeIcon({ type, size = 13 }: { type: Type; size?: number }) {
  const shape = TYPE_SHAPE[type];
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-label={shape.label} className="shrink-0">
      <path d={shape.d} fill={shape.color} />
    </svg>
  );
}

export function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden className={`transition-transform ${open ? "rotate-90" : ""}`}>
      <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Creation: the global dialog (#10's FAB target) ───────────────────────

export function CreateDialog({ onClose, phone, initialParent }: {
  onClose: () => void; phone: boolean; initialParent?: number | null;
}) {
  const t = useTree();
  const seededType = initialParent == null ? null : t.childTypeOf(initialParent);
  const [type, setType] = useState<Type>(seededType ?? "Topic");
  const [parent, setParent] = useState<number | "">(initialParent ?? "");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState("");
  const [status, setStatus] = useState<Status>("Open");
  const [assignee, setAssignee] = useState<string>("");
  const [labels, setLabels] = useState<string[]>([]);

  const parents = t.validParentsFor(type);
  const needsParent = type !== "Topic";
  const ready = summary.trim().length > 0 && (!needsParent || parent !== "");

  const pickType = (next: Type) => {
    setType(next);
    // The old parent almost never fits the new rung, so it is dropped rather than
    // silently kept and rejected on submit.
    setParent("");
  };

  const submit = () => {
    if (!ready) return;
    t.create(needsParent ? Number(parent) : null, summary.trim(), {
      type,
      status,
      description: description.trim() || undefined,
      due: due || null,
      assignee: assignee || null,
      labels,
    });
    onClose();
  };

  const Field = ({ label, required, children: c }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <label className="mb-3 block">
      <span className="mb-1 flex items-baseline gap-1.5 text-[11px] font-semibold tracking-wide text-faint uppercase">
        {label}
        {required && <span className="text-[10px] font-medium text-primary normal-case">required</span>}
      </span>
      {c}
    </label>
  );

  const input = "w-full rounded border border-line px-2 py-2 text-[14px] outline-none focus:border-primary";

  return (
    <>
      <div onClick={onClose} className="absolute inset-0 z-40 bg-black/25" />
      <div
        className={
          phone
            ? "absolute inset-x-0 bottom-0 z-50 max-h-[88%] overflow-y-auto rounded-t-xl border-t border-line bg-bg p-4 shadow-2xl"
            : "absolute top-1/2 left-1/2 z-50 max-h-[86%] w-[520px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-line bg-bg p-4 shadow-2xl"
        }
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">New work item</h2>
          <button onClick={onClose} className="rounded px-2 text-muted hover:bg-surface">✕</button>
        </div>

        <Field label="Type" required>
          <div className="flex gap-1 rounded border border-line p-1">
            {(["Topic", "Project", "Task", "Subtask"] as Type[]).map((ty) => (
              <button
                key={ty}
                onClick={() => pickType(ty)}
                className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded text-[13px] ${
                  type === ty ? "bg-primary-soft font-medium text-primary" : "text-muted hover:bg-surface"
                }`}
              >
                <TypeIcon type={ty} size={12} /> {ty}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Summary" required>
          <input
            autoFocus
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="What needs doing?"
            className={input}
          />
        </Field>

        <Field label={needsParent ? `Parent ${type === "Project" ? "Topic" : type === "Task" ? "Project" : "Task"}` : "Parent"} required={needsParent}>
          {needsParent ? (
            <select value={parent} onChange={(e) => setParent(e.target.value === "" ? "" : Number(e.target.value))} className={`min-h-11 ${input}`}>
              <option value="">Choose one…</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {t.lineage(p.id) ? `${t.lineage(p.id)} › ` : ""}{p.summary}
                </option>
              ))}
            </select>
          ) : (
            <p className="rounded border border-dashed border-line px-2 py-2 text-[13px] text-faint">A Topic sits at the root — it has no parent.</p>
          )}
        </Field>

        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Markdown" className={input} />
        </Field>

        <div className="flex gap-3">
          <div className="flex-1"><Field label="Due date"><input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={`min-h-11 ${input}`} /></Field></div>
          <div className="flex-1">
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={`min-h-11 ${input}`}>
                {(["Open", "In Progress", "Completed", "Closed"] as Status[]).map((st) => <option key={st}>{st}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <Field label="Assignee">
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={`min-h-11 ${input}`}>
            <option value="">Unassigned</option>
            {PEOPLE.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>

        <Field label="Labels">
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(LABELS).map((l) => {
              const on = labels.includes(l);
              return (
                <button
                  key={l}
                  onClick={() => setLabels((s) => (on ? s.filter((x) => x !== l) : [...s, l]))}
                  className={`rounded border px-2 py-1 text-[12px] ${on ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface text-muted"}`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="mt-2 flex items-center justify-end gap-2">
          <span className="mr-auto text-[12px] text-faint">
            {ready ? "Everything below Summary is optional." : summary.trim() ? "Pick a parent." : "Summary is required; everything else is optional."}
          </span>
          <button onClick={onClose} className="min-h-11 rounded border border-line px-3 text-[13px]">Cancel</button>
          <button
            onClick={submit}
            disabled={!ready}
            className="min-h-11 rounded bg-primary px-3 text-[13px] font-medium text-primary-fg disabled:opacity-40"
          >
            Create
          </button>
        </div>
      </div>
    </>
  );
}

// ── Reparent: the parent picker (ADR-0016) ───────────────────────────────

export function MoveDialog({ id, onClose, phone }: { id: number; onClose: () => void; phone: boolean }) {
  const t = useTree();
  const item = t.byId(id);
  const options = t.validParentsFor(item.type, id);
  return (
    <>
      <div onClick={onClose} className="absolute inset-0 z-40 bg-black/25" />
      <div
        className={
          phone
            ? "absolute inset-x-0 bottom-0 z-50 max-h-[70%] overflow-y-auto rounded-t-xl border-t border-line bg-bg p-4 shadow-2xl"
            : "absolute top-1/2 left-1/2 z-50 max-h-[70%] w-[460px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-line bg-bg p-4 shadow-2xl"
        }
      >
        <h2 className="mb-1 text-[15px] font-semibold">Move “{item.summary}”</h2>
        <p className="mb-3 text-[12px] text-faint">
          A {item.type} moves to another {t.ancestors(id).slice(-1)[0]?.type ?? "parent"}. It takes its subtree with it.
        </p>
        {options.length === 0 && <p className="text-[13px] text-faint">A Topic has no parent to move to.</p>}
        <ul>
          {options.map((o) => (
            <li key={o.id}>
              <button
                onClick={() => { t.reparent(id, o.id); onClose(); }}
                className={`touch-min flex w-full items-center gap-2 rounded px-2 py-2 text-left hover:bg-surface ${
                  o.id === item.parentId ? "bg-primary-soft" : ""
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[13px] ${!unfinished(o) ? "text-faint" : ""}`}>{o.summary}</span>
                  <span className="block truncate text-[11px] text-faint">{t.lineage(o.id) || "Topic"}</span>
                </span>
                {!unfinished(o) && <StatusBadge status={o.status} />}
                {o.id === item.parentId && <span className="text-[11px] text-primary">current</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-end">
          <button onClick={onClose} className="min-h-11 rounded border border-line px-3 text-[13px]">Cancel</button>
        </div>
      </div>
    </>
  );
}

// ── The other tabs, kept thin — they exist so the tree has neighbours ────

export function DueTab({ onOpen }: { onOpen: (id: number) => void }) {
  const t = useTree();
  const [mineOnly, setMineOnly] = useState(true);
  const keep = (i: WorkItem) => !mineOnly || i.assignee === ME || i.assignee === null;
  const dated = t.items.filter((i) => unfinished(i) && i.due && daysOut(i.due) <= 30).filter(keep);
  const visible = dated
    .filter((i) => !t.descendants(i.id).some((d) => unfinished(d) && d.due && dated.includes(d) && d.due <= i.due!))
    .sort((a, b) => (a.due! < b.due! ? -1 : a.due! > b.due! ? 1 : a.id - b.id));

  const Group = ({ title, hint, items }: { title: string; hint: string; items: WorkItem[] }) => (
    <section>
      <div className="flex items-baseline gap-2 px-3 pt-4 pb-1.5">
        <h3 className="text-[13px] font-semibold">{title}</h3>
        <span className="text-[11px] text-faint">{hint}</span>
      </div>
      {items.length === 0 ? (
        <p className="px-3 py-2 text-[13px] text-faint">Nothing.</p>
      ) : (
        <ul className="border-t border-line">
          {items.map((i) => (
            <li key={i.id}>
              <button onClick={() => onOpen(i.id)} className="touch-min flex w-full items-center gap-2 border-b border-line px-3 py-2 text-left hover:bg-surface">
                <Avatar name={i.assignee} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{i.summary}</span>
                  <span className="block truncate text-[11px] text-faint">{t.lineage(i.id) || i.type}</span>
                </span>
                <DueCell due={i.due} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between px-3 pt-3">
        <span className="text-[11px] text-faint">{formatDue(TODAY)} · 30-day horizon</span>
        <button onClick={() => setMineOnly((v) => !v)} className="touch-min rounded border border-line px-2 py-1 text-[12px] hover:bg-surface">
          {mineOnly ? "Mine + unassigned" : "Everyone"}
        </button>
      </div>
      <Group title="Due Now" hint="today or overdue" items={visible.filter((i) => daysOut(i.due!) <= 0)} />
      <Group title="Due Soon" hint="next 7 days" items={visible.filter((i) => daysOut(i.due!) > 0 && daysOut(i.due!) <= 7)} />
      <Group title="Due Later" hint="the 23 after" items={visible.filter((i) => daysOut(i.due!) > 7)} />
    </div>
  );
}

export function SearchTab({ onOpen }: { onOpen: (id: number) => void }) {
  const t = useTree();
  const [q, setQ] = useState("");
  const rows = t.items.filter((i) => i.summary.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="pb-6">
      <div className="p-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Keyword" className="w-full rounded border border-line px-2 py-2 outline-none focus:border-primary" />
        <p className="mt-2 text-[11px] text-faint">Filter bar stubbed — Search is #18's question.</p>
      </div>
      <ul className="border-t border-line">
        {rows.map((i) => (
          <li key={i.id}>
            <button onClick={() => onOpen(i.id)} className="touch-min flex w-full items-center gap-2 border-b border-line px-3 py-2 text-left hover:bg-surface">
              <span className="min-w-0 flex-1">
                <span className="block truncate">{i.summary}</span>
                <span className="block truncate text-[11px] text-faint">{t.byId(i.id).parentId ? t.byId(t.byId(i.id).parentId!).summary : "Topic"}</span>
              </span>
              <StatusBadge status={i.status} />
              <DueCell due={i.due} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SettingsTab() {
  return (
    <div className="p-4 text-[13px] text-muted">
      <p className="mb-2 font-semibold text-fg">Settings</p>
      <p>Stubbed — #6 decided this surface. Members: {PEOPLE.join(", ")}.</p>
    </div>
  );
}

// The detail view itself is #12's question and lives in src/variants/Detail{A,B,C}.tsx.
