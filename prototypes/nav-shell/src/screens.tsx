// PROTOTYPE — throwaway. Shared *content* renderers. Layout is deliberately NOT
// shared: each variant owns its own shell.
import {
  ITEMS, LABELS, ME, PEOPLE, TODAY, byId, children, dueRadar, formatDue,
  lineage, unfinished, type Status, type WorkItem,
} from "./data";
import { useState } from "react";

const statusTone: Record<Status, string> = {
  Open: "text-open border-line",
  "In Progress": "text-progress border-progress/30",
  Completed: "text-completed border-completed/30",
  Closed: "text-closed border-line",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`shrink-0 rounded border px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider ${statusTone[status]}`}>
      {status === "In Progress" ? "In prog" : status}
    </span>
  );
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

// ── Due tab ──────────────────────────────────────────────────────────────

export function DueTab({ onOpen, selected, dense, trailing }: { onOpen: (id: number) => void; selected?: number | null; dense?: boolean; trailing?: React.ReactNode }) {
  const [mineOnly, setMineOnly] = useState(true);
  const radar = dueRadar();
  const keep = (i: WorkItem) => !mineOnly || i.assignee === ME || i.assignee === null;

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
              <button
                onClick={() => onOpen(i.id)}
                className={`touch-min flex w-full items-center gap-2 border-b border-line px-3 text-left hover:bg-surface ${
                  dense ? "py-1.5" : "py-2.5"
                } ${selected === i.id ? "bg-primary-soft" : ""}`}
              >
                <Avatar name={i.assignee} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{i.summary}</span>
                  <span className="block truncate text-[11px] text-faint">{lineage(i.id) || i.type}</span>
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
        <span className="flex items-center gap-2">
          <button
            onClick={() => setMineOnly((v) => !v)}
            className="touch-min rounded border border-line px-2 py-1 text-[12px] hover:bg-surface"
          >
            {mineOnly ? "Mine + unassigned" : "Everyone"}
          </button>
          {trailing}
        </span>
      </div>
      <Group title="Due Now" hint="today or overdue" items={radar.now.filter(keep)} />
      <Group title="Due Soon" hint="next 7 days" items={radar.soon.filter(keep)} />
      <Group title="Due Later" hint="the 23 after" items={radar.later.filter(keep)} />
    </div>
  );
}

// ── Work Items tree ──────────────────────────────────────────────────────

export function TreeTab({ onOpen, selected, dense, hideNewTopic, trailing }: { onOpen: (id: number) => void; selected?: number | null; dense?: boolean; hideNewTopic?: boolean; trailing?: React.ReactNode }) {
  const [open, setOpen] = useState<Set<number>>(new Set([1, 2, 3, 9, 10, 16]));
  const [showDone, setShowDone] = useState(false);

  const toggle = (id: number) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const Row = ({ item, depth }: { item: WorkItem; depth: number }) => {
    const kids = children(item.id).filter((c) => showDone || unfinished(c));
    const isOpen = open.has(item.id);
    return (
      <>
        <li>
          <div
            className={`touch-min flex items-center gap-1.5 border-b border-line pr-3 hover:bg-surface ${
              dense ? "py-1" : "py-2"
            } ${selected === item.id ? "bg-primary-soft" : ""}`}
            style={{ paddingLeft: 8 + depth * 18 }}
          >
            <button
              onClick={() => toggle(item.id)}
              className={`h-5 w-5 shrink-0 rounded text-[10px] text-faint hover:bg-raised ${kids.length ? "" : "invisible"}`}
            >
              {isOpen ? "▾" : "▸"}
            </button>
            <button onClick={() => onOpen(item.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
              <span className={`truncate ${item.type === "Topic" ? "font-semibold" : ""} ${!unfinished(item) ? "text-faint line-through" : ""}`}>
                {item.summary}
              </span>
            </button>
            <StatusBadge status={item.status} />
            <Avatar name={item.assignee} />
            <span className="w-20 text-right text-[12px]">
              <DueCell due={item.due} />
            </span>
          </div>
        </li>
        {isOpen && kids.map((c) => <Row key={c.id} item={c} depth={depth + 1} />)}
      </>
    );
  };

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between px-3 py-2">
        {hideNewTopic ? <span /> : (
          <button className="touch-min rounded bg-primary px-2.5 py-1 text-[12px] font-medium text-primary-fg">+ New Topic</button>
        )}
        <span className="flex items-center gap-2">
          <button onClick={() => setShowDone((v) => !v)} className="touch-min rounded border border-line px-2 py-1 text-[12px] hover:bg-surface">
            {showDone ? "Hide completed" : "Show completed"}
          </button>
          {trailing}
        </span>
      </div>
      <ul className="border-t border-line">
        {children(null).map((t) => <Row key={t.id} item={t} depth={0} />)}
      </ul>
    </div>
  );
}

// ── Search ───────────────────────────────────────────────────────────────

export function SearchTab({ onOpen, selected, layout, trailing }: { onOpen: (id: number) => void; selected?: number | null; layout: "table" | "stacked"; trailing?: React.ReactNode }) {
  const [q, setQ] = useState("");
  const rows = ITEMS.filter((i) => i.summary.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="pb-6">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-3 py-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Keyword"
          className="touch-min min-w-40 flex-1 rounded border border-line px-2 py-1 outline-none focus:border-primary"
        />
        {layout === "table" ? (
          ["Type", "Status", "Assignee", "Parent", "Due", "Labels"].map((f) => (
            <button key={f} className="touch-min rounded border border-line px-2 py-1 text-[12px] text-muted hover:bg-surface">
              {f} <span className="text-faint">▾</span>
            </button>
          ))
        ) : (
          <button className="touch-min rounded border border-line px-2.5 py-1 text-[12px]">Filters</button>
        )}
        {trailing}
      </div>

      {layout === "table" ? (
        <table className="w-full text-left">
          <thead className="text-[11px] uppercase tracking-wide text-faint">
            <tr className="border-b border-line">
              <th className="w-[45%] px-3 py-1.5 font-medium">Summary</th>
              <th className="px-2 py-1.5 font-medium">Type</th>
              <th className="px-2 py-1.5 font-medium">Parent</th>
              <th className="px-2 py-1.5 font-medium">Status</th>
              <th className="px-2 py-1.5 font-medium">Assignee</th>
              <th className="px-2 py-1.5 font-medium">Due ▾</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr
                key={i.id}
                onClick={() => onOpen(i.id)}
                className={`cursor-pointer border-b border-line hover:bg-surface ${selected === i.id ? "bg-primary-soft" : ""}`}
              >
                <td className="w-[45%] max-w-0 truncate px-3 py-1.5">{i.summary}</td>
                <td className="px-2 py-1.5 text-muted">{i.type}</td>
                <td className="max-w-32 truncate px-2 py-1.5 text-muted">{i.parentId ? byId.get(i.parentId)!.summary : "—"}</td>
                <td className="px-2 py-1.5"><StatusBadge status={i.status} /></td>
                <td className="px-2 py-1.5"><Avatar name={i.assignee} /></td>
                <td className="px-2 py-1.5"><DueCell due={i.due} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul>
          {rows.map((i) => (
            <li key={i.id}>
              <button onClick={() => onOpen(i.id)} className="touch-min flex w-full flex-col items-start gap-0.5 border-b border-line px-3 py-2 text-left hover:bg-surface">
                <span className="flex w-full items-center gap-2">
                  <span className="min-w-0 flex-1 truncate">{i.summary}</span>
                  <DueCell due={i.due} />
                </span>
                <span className="flex w-full items-center gap-2 text-[11px] text-faint">
                  <span className="truncate">{i.type}{i.parentId ? ` in ${byId.get(i.parentId)!.summary}` : ""}</span>
                  <StatusBadge status={i.status} />
                  <Avatar name={i.assignee} size={16} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="px-3 py-2 text-[11px] text-faint">{rows.length} work items</p>
    </div>
  );
}

// ── Detail ───────────────────────────────────────────────────────────────

export function ItemDetail({ id, onOpen, onClose, showHeader = true }: {
  id: number; onOpen: (id: number) => void; onClose?: () => void; showHeader?: boolean;
}) {
  const item = byId.get(id)!;
  const kids = children(item.id);

  return (
    <article className="pb-10">
      {showHeader && (
      <header className="border-b border-line px-4 py-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <nav className="mb-1 truncate text-[11px] text-faint">
                {lineage(item.id) || "Topics"} <span className="text-line">›</span> <span className="text-muted">{item.type}</span>
            </nav>
            <h1 className="text-[17px] leading-snug font-semibold">{item.summary}</h1>
          </div>
          {onClose && (
            <button onClick={onClose} className="touch-min rounded px-2 text-muted hover:bg-surface" aria-label="Close">✕</button>
          )}
        </div>
      </header>
      )}

      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 text-[13px] sm:grid-cols-[auto_1fr_auto_1fr]">
        <dt className="text-faint">Status</dt>
        <dd><StatusBadge status={item.status} /></dd>
        <dt className="text-faint">Assignee</dt>
        <dd className="flex items-center gap-1.5"><Avatar name={item.assignee} />{item.assignee ?? "Unassigned"}</dd>
        <dt className="text-faint">Due</dt>
        <dd><DueCell due={item.due} /></dd>
        <dt className="text-faint">Labels</dt>
        <dd>{item.labels.length ? <Labels labels={item.labels} /> : <span className="text-faint">—</span>}</dd>
      </dl>

      <div className="border-b border-line px-4 py-3">
        <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-faint">Description</h2>
        <p className="text-[13px] leading-relaxed text-muted">{item.description ?? "No description."}</p>
      </div>

      {kids.length > 0 && (
        <div className="border-b border-line">
          <h2 className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-faint">Children</h2>
          <ul>
            {kids.map((c) => (
              <li key={c.id}>
                <button onClick={() => onOpen(c.id)} className="touch-min flex w-full items-center gap-2 border-t border-line px-4 py-2 text-left hover:bg-surface">
                  <span className="min-w-0 flex-1 truncate">{c.summary}</span>
                  <StatusBadge status={c.status} />
                  <Avatar name={c.assignee} />
                  <DueCell due={c.due} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="px-4 py-3">
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Comments</h2>
        {(item.comments ?? []).map((c, n) => (
          <div key={n} className="mb-2 flex gap-2">
            <Avatar name={c.author} size={24} />
            <div className="min-w-0">
              <p className="text-[12px] text-faint">{c.author} · {c.at}</p>
              <p className="text-[13px]">{c.body}</p>
            </div>
          </div>
        ))}
        <textarea placeholder="Add a comment…" rows={2} className="mt-1 w-full rounded border border-line px-2 py-1.5 text-[13px] outline-none focus:border-primary" />
      </div>
    </article>
  );
}

// ── Settings ─────────────────────────────────────────────────────────────

export function SettingsTab() {
  const Section = ({ title, children: c }: { title: string; children: React.ReactNode }) => (
    <section className="border-b border-line px-4 py-3">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">{title}</h2>
      {c}
    </section>
  );
  const Row = ({ label, control }: { label: string; control: React.ReactNode }) => (
    <div className="touch-min flex items-center justify-between py-1.5">
      <span className="text-[13px]">{label}</span>
      {control}
    </div>
  );
  return (
    <div className="pb-8">
      <Section title="You">
        <Row label="Theme" control={<select className="rounded border border-line px-2 py-1 text-[12px]"><option>System</option><option>Light</option><option>Dark</option></select>} />
        <Row label="Signed in as dave@example.com" control={<button className="rounded border border-line px-2 py-1 text-[12px]">Sign out</button>} />
      </Section>
      <Section title="Household">
        <Row label="Timezone" control={<select className="rounded border border-line px-2 py-1 text-[12px]"><option>America/Los_Angeles</option></select>} />
        <div className="pt-1">
          <p className="mb-1 text-[12px] text-faint">Members</p>
          {PEOPLE.map((p) => (
            <div key={p} className="flex items-center gap-2 py-1 text-[13px]"><Avatar name={p} />{p}</div>
          ))}
        </div>
      </Section>
      <Section title="Labels">
        <div className="flex flex-wrap gap-1.5 pb-2">
          {Object.keys(LABELS).map((l) => <Labels key={l} labels={[l]} />)}
        </div>
        <button className="rounded border border-line px-2 py-1 text-[12px]">Add label</button>
      </Section>
    </div>
  );
}
