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

export function StatusDot({ status }: { status: Status }) {
  const tone: Record<Status, string> = {
    Open: "border border-faint",
    "In Progress": "bg-progress",
    Completed: "bg-completed",
    Closed: "bg-closed",
  };
  return <span title={status} className={`inline-block h-2 w-2 shrink-0 rounded-full ${tone[status]}`} />;
}

export function Labels({ labels }: { labels: string[] }) {
  if (!labels.length) return null;
  return (
    <span className="flex shrink-0 gap-1">
      {labels.map((l) => (
        <span key={l} className={`rounded px-1.5 py-px text-[11px] text-fg/70 ${LABELS[l] ?? "bg-raised"}`}>{l}</span>
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

export function DueCell({ due }: { due: string | null }) {
  const overdue = due != null && due < TODAY;
  return <span className={`shrink-0 tabular-nums ${overdue ? "font-medium text-overdue" : "text-muted"}`}>{formatDue(due)}</span>;
}

export const TYPE_GLYPH: Record<Type, string> = { Topic: "◈", Project: "▣", Task: "▸", Subtask: "·" };

// ── Creation: the global dialog (#10's FAB target) ───────────────────────

export function CreateDialog({ onClose, phone, initialParent }: {
  onClose: () => void; phone: boolean; initialParent?: number | null;
}) {
  const t = useTree();
  const [parent, setParent] = useState<number | "">(initialParent ?? "");
  const [summary, setSummary] = useState("");
  const parentItem = parent === "" ? null : t.byId(Number(parent));
  const type = t.childTypeOf(parent === "" ? null : Number(parent));
  const candidates = t.items.filter((i) => i.type !== "Subtask");

  const submit = () => {
    if (summary.trim()) t.create(parent === "" ? null : Number(parent), summary.trim());
    onClose();
  };

  return (
    <>
      <div onClick={onClose} className="absolute inset-0 z-40 bg-black/25" />
      <div
        className={
          phone
            ? "absolute inset-x-0 bottom-0 z-50 rounded-t-xl border-t border-line bg-bg p-4 shadow-2xl"
            : "absolute top-1/2 left-1/2 z-50 w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line bg-bg p-4 shadow-2xl"
        }
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">New {type ?? "—"}</h2>
          <button onClick={onClose} className="rounded px-2 text-muted hover:bg-surface">✕</button>
        </div>
        <label className="mb-1 block text-[11px] font-semibold tracking-wide text-faint uppercase">Summary</label>
        <input
          autoFocus
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="What needs doing?"
          className="mb-3 w-full rounded border border-line px-2 py-2 outline-none focus:border-primary"
        />
        <label className="mb-1 block text-[11px] font-semibold tracking-wide text-faint uppercase">Under</label>
        <select
          value={parent}
          onChange={(e) => setParent(e.target.value === "" ? "" : Number(e.target.value))}
          className="min-h-11 w-full rounded border border-line px-2 py-1.5"
        >
          <option value="">Nothing — this is a new Topic</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {"— ".repeat(c.type === "Topic" ? 0 : c.type === "Project" ? 1 : 2)}{c.summary} ({c.type})
            </option>
          ))}
        </select>
        <p className="mt-2 text-[12px] text-faint">
          The parent decides the type. No parent means a Topic{parentItem ? ` · under ${parentItem.summary}` : ""}.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="min-h-11 rounded border border-line px-3 text-[13px]">Cancel</button>
          <button onClick={submit} className="min-h-11 rounded bg-primary px-3 text-[13px] font-medium text-primary-fg">Create</button>
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

// ── Detail view — stubbed, #12's question ────────────────────────────────

export function ItemDetail({ id, onOpen, onMove, showHeader = true }: {
  id: number; onOpen: (id: number) => void; onMove: (id: number) => void; showHeader?: boolean;
}) {
  const t = useTree();
  const item = t.byId(id);
  const kids = t.children(id);
  return (
    <article className="pb-10">
      {showHeader && (
        <header className="border-b border-line px-4 py-3">
          <nav className="mb-1 truncate text-[11px] text-faint">
            {t.lineage(id) || "Topics"} <span className="text-line">›</span> <span className="text-muted">{item.type}</span>
          </nav>
          <h1 className="text-[17px] leading-snug font-semibold">{item.summary}</h1>
        </header>
      )}
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 text-[13px]">
        <dt className="text-faint">Status</dt>
        <dd className="flex items-center gap-2">
          <StatusBadge status={item.status} />
          {unfinished(item) && (
            <>
              <button onClick={() => t.setStatus(id, "In Progress")} className="rounded border border-line px-1.5 py-px text-[11px] hover:bg-surface">Start</button>
              <button onClick={() => t.setStatus(id, "Completed")} className="rounded border border-line px-1.5 py-px text-[11px] hover:bg-surface">Complete</button>
              <button onClick={() => t.setStatus(id, "Closed")} className="rounded border border-line px-1.5 py-px text-[11px] hover:bg-surface">Close</button>
            </>
          )}
          {!unfinished(item) && (
            <button onClick={() => t.setStatus(id, "Open")} className="rounded border border-line px-1.5 py-px text-[11px] hover:bg-surface">Reopen</button>
          )}
        </dd>
        <dt className="text-faint">Assignee</dt>
        <dd className="flex items-center gap-1.5"><Avatar name={item.assignee} />{item.assignee ?? "Unassigned"}</dd>
        <dt className="text-faint">Due</dt>
        <dd><DueCell due={item.due} /></dd>
        <dt className="text-faint">Parent</dt>
        <dd className="flex items-center gap-2">
          <span>{item.parentId ? t.byId(item.parentId).summary : "—"}</span>
          {item.type !== "Topic" && (
            <button onClick={() => onMove(id)} className="rounded border border-line px-1.5 py-px text-[11px] hover:bg-surface">Move</button>
          )}
        </dd>
      </dl>
      {kids.length > 0 && (
        <div>
          <h2 className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-faint uppercase">Children</h2>
          <ul>
            {kids.map((c) => (
              <li key={c.id}>
                <button onClick={() => onOpen(c.id)} className="touch-min flex w-full items-center gap-2 border-t border-line px-4 py-2 text-left hover:bg-surface">
                  <span className="min-w-0 flex-1 truncate">{c.summary}</span>
                  <StatusBadge status={c.status} short />
                  <Avatar name={c.assignee} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="px-4 pt-4 text-[12px] text-faint">Detail view is #12's question — stubbed here.</p>
    </article>
  );
}
