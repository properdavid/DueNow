// PROTOTYPE — throwaway. Variant A — TABLE.
// Stance: Search is a *register*, and a register wants columns. Takes ADR-0012's
// "table on desktop with sortable headers" literally, which means it also takes the
// width it needs: on desktop this tab **overrides ADR-0017's split** and owns the
// whole pane, with a work item opening as a push and a Back to results. Filters are
// a bar of six dropdown controls that *say what they are doing in their own label*;
// there is no chip row, because a chip row would print the same thing twice. On
// phone the bar collapses into a Filters sheet that batches behind an Apply button.
import { useEffect, useRef, useState } from "react";
import { TODAY, type Status, type Type } from "../data";
import { useNav } from "../proto";
import { Avatar, StatusIcon, TypeIcon } from "../screens";
import type { SearchProps } from "../shell";
import { useTree } from "../store";
import {
  ALL_LABELS,
  ASSIGNEES,
  DUE_MODES,
  SORTS,
  STATUSES,
  TYPES,
  activeDimensions,
  isFiltered,
  runQuery,
  typeAhead,
  updatedLabel,
  useQuery,
  type DueMode,
  type Query,
  type Sort,
} from "../search";

/** A register prints dates, not distances — one column, one format, sortable. */
function stamp(due: string | null): string {
  if (!due) return "—";
  return new Date(due + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function SearchA({ onOpen, selected, compact }: SearchProps) {
  const t = useTree();
  const { scenario } = useNav();
  const [query, write, clear] = useQuery();
  const rows = runQuery(t, query, scenario);

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg">
      {compact ? (
        <CompactBar query={query} write={write} clear={clear} count={rows.length} />
      ) : (
        <DesktopBar query={query} write={write} clear={clear} count={rows.length} />
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        {rows.length === 0 ? (
          <Empty filtered={isFiltered(query)} corpusEmpty={scenario === "empty"} q={query.q} onClear={clear} />
        ) : compact ? (
          <ul>
            {rows.map((i) => (
              <li key={i.id}>
                <button
                  onClick={() => onOpen(i.id)}
                  className="touch-min flex w-full flex-col items-start gap-1 border-b border-line px-4 py-2.5 text-left hover:bg-surface"
                >
                  <span className="flex w-full items-center gap-1.5 text-[11px] text-faint">
                    <TypeIcon type={i.type} size={10} />
                    <span className="truncate">{i.parentId ? t.byId(i.parentId).summary : "Top level"}</span>
                    <span
                      className={`ml-auto shrink-0 tabular-nums ${
                        i.due && i.due < TODAY && (i.status === "Open" || i.status === "In Progress") ? "font-medium text-overdue" : ""
                      }`}
                    >
                      {stamp(i.due)}
                    </span>
                  </span>
                  <span className="w-full text-[14px] leading-snug">{i.summary}</span>
                  <span className="flex items-center gap-2 text-[11px] text-muted">
                    <StatusIcon status={i.status} size={11} />
                    {i.status}
                    <Avatar name={i.assignee} size={17} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="border-b border-line text-left text-[11px] tracking-wide text-muted uppercase">
                <Th sortKey="id" query={query} write={write} className="w-14 pl-4">#</Th>
                <th className="px-2 py-1.5 font-semibold">Summary</th>
                <th className="w-52 px-2 py-1.5 font-semibold">Parent</th>
                <th className="w-24 px-2 py-1.5 font-semibold">Assignee</th>
                <th className="w-28 px-2 py-1.5 font-semibold">Status</th>
                <Th sortKey="due" query={query} write={write} className="w-28">Due</Th>
                <Th sortKey="updated" query={query} write={write} className="w-28 pr-4">Updated</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr
                  key={i.id}
                  onClick={() => onOpen(i.id)}
                  className={`cursor-pointer border-b border-line ${selected === i.id ? "bg-primary-soft" : "hover:bg-surface"}`}
                >
                  <td className="py-1.5 pl-4 text-[12px] tabular-nums text-faint">{i.id}</td>
                  <td className="px-2 py-1.5">
                    <span className="flex items-center gap-1.5">
                      <TypeIcon type={i.type} size={11} />
                      <span className="truncate">{i.summary}</span>
                    </span>
                  </td>
                  <td className="truncate px-2 py-1.5 text-muted">{i.parentId ? t.byId(i.parentId).summary : "—"}</td>
                  <td className="px-2 py-1.5">
                    <span className="flex items-center gap-1.5 text-muted">
                      <Avatar name={i.assignee} size={18} />
                      <span className="truncate text-[12px]">{i.assignee ?? "Unassigned"}</span>
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className="flex items-center gap-1.5 text-[12px] text-muted">
                      <StatusIcon status={i.status} size={12} />
                      {i.status}
                    </span>
                  </td>
                  <td className={`px-2 py-1.5 tabular-nums ${i.due && i.due < TODAY && (i.status === "Open" || i.status === "In Progress") ? "font-medium text-overdue" : "text-muted"}`}>
                    {stamp(i.due)}
                  </td>
                  <td className="py-1.5 pr-4 text-[12px] text-faint">{updatedLabel(i)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Th({
  sortKey,
  query,
  write,
  className = "",
  children,
}: {
  sortKey: Sort;
  query: Query;
  write: (p: Partial<Query>) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const on = query.sort === sortKey;
  return (
    <th className={`px-2 py-1.5 font-semibold ${className}`}>
      <button
        onClick={() => write(on ? { dir: query.dir === "asc" ? "desc" : "asc" } : { sort: sortKey, dir: "asc" })}
        className={`flex items-center gap-1 uppercase hover:text-fg ${on ? "text-fg" : ""}`}
      >
        {children}
        <span className={on ? "" : "opacity-0"}>{query.dir === "asc" ? "↑" : "↓"}</span>
      </button>
    </th>
  );
}

// ── Desktop: six dropdowns that carry their own state in their label ──────

function DesktopBar({
  query,
  write,
  clear,
  count,
}: {
  query: Query;
  write: (p: Partial<Query>) => void;
  clear: () => void;
  count: number;
}) {
  const [draft, setDraft] = useState(query.q);
  useEffect(() => setDraft(query.q), [query.q]);
  const t = useTree();
  const { scenario } = useNav();

  return (
    <header className="shrink-0 border-b border-line bg-bg px-4 py-2.5">
      <div className="flex items-center gap-2">
        <h2 className="text-[17px] font-semibold tracking-tight">Search</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            write({ q: draft });
          }}
          className="ml-2 flex min-w-0 flex-1 items-center gap-1.5 rounded border border-line px-2 focus-within:border-primary"
        >
          <span className="text-[14px] text-faint">⌕</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Keyword — summary and description, all words must match"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-[13px] outline-none"
          />
          {draft && (
            <button type="button" onClick={() => { setDraft(""); write({ q: "" }); }} className="text-[13px] text-faint hover:text-fg">
              ✕
            </button>
          )}
          <button type="submit" className="rounded bg-raised px-2 py-0.5 text-[11px] text-muted hover:bg-line">
            ⏎
          </button>
        </form>
        <span className="shrink-0 text-[12px] tabular-nums text-muted">{count} results</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Menu label="Type" summary={query.types.join(", ")}>
          <CheckList options={TYPES} chosen={query.types} onToggle={(v) => write({ types: toggle(query.types, v as Type) })} />
        </Menu>
        <Menu label="Status" summary={query.statuses.join(", ")}>
          <CheckList options={STATUSES} chosen={query.statuses} onToggle={(v) => write({ statuses: toggle(query.statuses, v as Status) })} />
        </Menu>
        <Menu label="Assignee" summary={query.assignees.join(", ")}>
          <CheckList options={ASSIGNEES} chosen={query.assignees} onToggle={(v) => write({ assignees: toggle(query.assignees, v) })} />
        </Menu>
        <Menu label="Parent" summary={query.parent == null ? "" : t.byId(query.parent).summary} wide>
          <ParentPicker
            value={query.parent}
            onPick={(id) => write({ parent: id })}
            options={typeAhead(t, "", scenario)}
          />
        </Menu>
        <Menu label="Due" summary={query.due === "any" ? "" : dueSummary(query)} wide>
          <DuePicker query={query} write={write} />
        </Menu>
        <Menu label="Labels" summary={query.labels.join(", ")}>
          <CheckList options={ALL_LABELS} chosen={query.labels} onToggle={(v) => write({ labels: toggle(query.labels, v) })} />
        </Menu>

        {activeDimensions(query).length > 0 && (
          <button onClick={clear} className="ml-1 text-[12px] text-primary hover:underline">
            Clear filters
          </button>
        )}

        <span className="ml-auto flex items-center gap-1.5 text-[12px] text-faint">
          <span>Sort in the header ↑</span>
        </span>
      </div>
    </header>
  );
}

function dueSummary(q: Query): string {
  const label = DUE_MODES.find((m) => m.key === q.due)!.label;
  if (q.due === "between") return `${q.from || "…"} → ${q.to || "…"}`;
  if (q.due === "before" || q.due === "after") return `${label} ${q.from || "…"}`;
  return label;
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function Menu({
  label,
  summary,
  wide,
  children,
}: {
  label: string;
  summary: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", on);
    return () => window.removeEventListener("mousedown", on);
  }, []);
  const active = summary.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex max-w-[240px] items-center gap-1 rounded border px-2 py-1 text-[12px] ${
          active ? "border-primary bg-primary-soft text-primary" : "border-line text-muted hover:bg-surface"
        }`}
      >
        <span className={active ? "font-medium" : ""}>{label}</span>
        {active && <span className="truncate">: {summary}</span>}
        <span className="text-[9px] opacity-60">▾</span>
      </button>
      {open && (
        <div
          className={`absolute top-full left-0 z-40 mt-1 rounded-lg border border-line bg-bg p-1 shadow-lg shadow-black/10 ${wide ? "w-72" : "w-48"}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function CheckList({ options, chosen, onToggle }: { options: string[]; chosen: string[]; onToggle: (v: string) => void }) {
  return (
    <ul className="max-h-72 overflow-y-auto">
      {options.map((o) => (
        <li key={o}>
          <button
            onClick={() => onToggle(o)}
            className="touch-min flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] hover:bg-surface"
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border text-[10px] ${
                chosen.includes(o) ? "border-primary bg-primary text-primary-fg" : "border-line"
              }`}
            >
              {chosen.includes(o) ? "✓" : ""}
            </span>
            {o}
          </button>
        </li>
      ))}
    </ul>
  );
}

function ParentPicker({
  value,
  onPick,
  options,
}: {
  value: number | null;
  onPick: (id: number | null) => void;
  options: { id: number; summary: string; type: Type }[];
}) {
  const [term, setTerm] = useState("");
  const shown = options.filter((o) => o.summary.toLowerCase().includes(term.toLowerCase()));
  return (
    <div>
      <input
        autoFocus
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Find a parent…"
        className="mb-1 w-full rounded border border-line px-2 py-1.5 text-[13px] outline-none focus:border-primary"
      />
      <p className="px-2 pb-1 text-[11px] text-faint">
        Matches the <b>immediate</b> parent only — one rung, not the whole subtree.
      </p>
      {value != null && (
        <button onClick={() => onPick(null)} className="mb-1 w-full rounded px-2 py-1 text-left text-[12px] text-primary hover:bg-surface">
          Clear parent
        </button>
      )}
      <ul className="max-h-60 overflow-y-auto">
        {shown.map((o) => (
          <li key={o.id}>
            <button
              onClick={() => onPick(o.id)}
              className={`touch-min flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] hover:bg-surface ${
                value === o.id ? "bg-primary-soft text-primary" : ""
              }`}
            >
              <TypeIcon type={o.type} size={11} />
              <span className="truncate">{o.summary}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DuePicker({ query, write }: { query: Query; write: (p: Partial<Query>) => void }) {
  return (
    <div className="p-1">
      {DUE_MODES.map((m) => (
        <div key={m.key}>
          <button
            onClick={() => write({ due: m.key as DueMode })}
            className="touch-min flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] hover:bg-surface"
          >
            <span
              className={`h-3.5 w-3.5 shrink-0 rounded-full border ${query.due === m.key ? "border-[4px] border-primary" : "border-line"}`}
            />
            {m.label}
          </button>
          {query.due === m.key && (m.key === "before" || m.key === "after" || m.key === "between") && (
            <div className="flex items-center gap-1 px-2 pb-2 pl-8">
              <input
                type="date"
                value={query.from}
                onChange={(e) => write({ from: e.target.value })}
                className="rounded border border-line px-1.5 py-1 text-[12px]"
              />
              {m.key === "between" && (
                <>
                  <span className="text-[11px] text-faint">to</span>
                  <input
                    type="date"
                    value={query.to}
                    onChange={(e) => write({ to: e.target.value })}
                    className="rounded border border-line px-1.5 py-1 text-[12px]"
                  />
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Phone: a Filters sheet that batches behind Apply ──────────────────────

function CompactBar({
  query,
  write,
  clear,
  count,
}: {
  query: Query;
  write: (p: Partial<Query>) => void;
  clear: () => void;
  count: number;
}) {
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState(query.q);
  useEffect(() => setDraft(query.q), [query.q]);
  const dims = activeDimensions(query).length;

  return (
    <>
      <header className="shrink-0 border-b border-line bg-bg px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-semibold tracking-tight">Search</h2>
          <span className="ml-auto text-[12px] tabular-nums text-muted">{count} results</span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            write({ q: draft });
            (e.currentTarget.querySelector("input") as HTMLInputElement)?.blur();
          }}
          className="mt-2 flex items-center gap-2"
        >
          <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded border border-line px-2 focus-within:border-primary">
            <span className="text-[14px] text-faint">⌕</span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Keyword"
              className="touch-min min-w-0 flex-1 bg-transparent py-1.5 text-[14px] outline-none"
            />
          </span>
          <button
            type="button"
            onClick={() => setSheet(true)}
            className={`touch-min flex shrink-0 items-center gap-1.5 rounded border px-3 text-[13px] ${
              dims ? "border-primary bg-primary-soft text-primary" : "border-line text-muted"
            }`}
          >
            Filters
            {dims > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[11px] tabular-nums text-primary-fg">{dims}</span>
            )}
          </button>
        </form>
      </header>
      {sheet && <FilterSheet query={query} write={write} clear={clear} onClose={() => setSheet(false)} />}
    </>
  );
}

function FilterSheet({
  query,
  write,
  clear,
  onClose,
}: {
  query: Query;
  write: (p: Partial<Query>) => void;
  clear: () => void;
  onClose: () => void;
}) {
  // Batched: the sheet edits a draft and only navigates on Apply, because on a phone
  // every keystroke of a live filter is a push onto the history stack.
  const [draft, setDraft] = useState<Query>(query);
  const t = useTree();
  const { scenario } = useNav();
  const patch = (p: Partial<Query>) => setDraft({ ...draft, ...p });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <button onClick={onClose} className="touch-min px-2 text-[13px] text-muted">
          Cancel
        </button>
        <span className="flex-1 text-center text-[15px] font-semibold">Filters</span>
        <button
          onClick={() => {
            clear();
            setDraft({ ...draft, types: [], statuses: [], assignees: [], parent: null, due: "any", labels: [] });
          }}
          className="touch-min px-2 text-[13px] text-primary"
        >
          Reset
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <Section title="Type">
          <Pills options={TYPES} chosen={draft.types} onToggle={(v) => patch({ types: toggle(draft.types, v as Type) })} />
        </Section>
        <Section title="Status">
          <Pills options={STATUSES} chosen={draft.statuses} onToggle={(v) => patch({ statuses: toggle(draft.statuses, v as Status) })} />
        </Section>
        <Section title="Assignee">
          <Pills options={ASSIGNEES} chosen={draft.assignees} onToggle={(v) => patch({ assignees: toggle(draft.assignees, v) })} />
        </Section>
        <Section title="Labels">
          <Pills options={ALL_LABELS} chosen={draft.labels} onToggle={(v) => patch({ labels: toggle(draft.labels, v) })} />
        </Section>
        <Section title="Due date">
          <DuePicker query={draft} write={patch} />
        </Section>
        <Section title="Parent">
          <ParentPicker value={draft.parent} onPick={(id) => patch({ parent: id })} options={typeAhead(t, "", scenario)} />
        </Section>
        <Section title="Sort">
          <Pills
            options={SORTS.map((s) => s.label)}
            chosen={[SORTS.find((s) => s.key === draft.sort)!.label]}
            onToggle={(v) => patch({ sort: SORTS.find((s) => s.label === v)!.key })}
          />
          <button
            onClick={() => patch({ dir: draft.dir === "asc" ? "desc" : "asc" })}
            className="touch-min mt-2 rounded border border-line px-3 text-[13px] text-muted"
          >
            {draft.dir === "asc" ? "Ascending ↑" : "Descending ↓"}
          </button>
        </Section>
      </div>

      <div className="border-t border-line p-3">
        <button
          onClick={() => {
            write(draft);
            onClose();
          }}
          className="touch-min w-full rounded-lg bg-primary py-2.5 text-[15px] font-medium text-primary-fg"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line py-3 last:border-0">
      <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Pills({ options, chosen, onToggle }: { options: string[]; chosen: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onToggle(o)}
          className={`touch-min rounded-full border px-3 text-[13px] ${
            chosen.includes(o) ? "border-primary bg-primary-soft font-medium text-primary" : "border-line text-muted"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Empty({
  filtered,
  corpusEmpty,
  q,
  onClear,
}: {
  filtered: boolean;
  corpusEmpty: boolean;
  q: string;
  onClear: () => void;
}) {
  if (corpusEmpty)
    return (
      <div className="px-8 py-16 text-center">
        <p className="text-[15px] font-medium">Nothing to search yet.</p>
        <p className="mt-1 text-[13px] text-muted">Create your first Topic and it will show up here.</p>
      </div>
    );
  return (
    <div className="px-8 py-16 text-center">
      <p className="text-[15px] font-medium">{q ? `No work item mentions “${q}”.` : "Nothing matches these filters."}</p>
      <p className="mt-1 text-[13px] text-muted">
        {q ? "Keyword looks at the summary and description, and every word has to match." : "Try loosening one of them."}
      </p>
      {filtered && (
        <button onClick={onClear} className="mt-3 text-[13px] text-primary hover:underline">
          Clear filters
        </button>
      )}
    </div>
  );
}

SearchA.fullPane = true;
