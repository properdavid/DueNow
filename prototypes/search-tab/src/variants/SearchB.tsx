// PROTOTYPE — throwaway. Variant B — CONSOLE.
// Stance: filtering is the *primary* act on this tab, so the filters are never
// hidden behind anything — a permanent facet rail down the left of the search pane,
// every dimension visible at once, with live counts so you can see what a value is
// worth before you spend a click on it. Applies live, no Apply button, no chips: a
// checked box in an always-visible rail already says what is on. Search stays inside
// ADR-0017's split, so the results list keeps its detail pane beside it — which is
// exactly the pressure worth feeling, because the rail and the list are then sharing
// one column. Sort is a select above the list; there are no column headers to click.
import { useEffect, useState } from "react";
import { TODAY, formatDue, type Status, type WorkItem } from "../data";
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
  activeValues,
  isFiltered,
  runQuery,
  typeAhead,
  updatedLabel,
  useQuery,
  type Query,
} from "../search";

export default function SearchB({ onOpen, selected, compact }: SearchProps) {
  const t = useTree();
  const { scenario } = useNav();
  const [query, write, clear] = useQuery();
  const rows = runQuery(t, query, scenario);

  /** A facet count ignores its own dimension — otherwise every unchecked box reads
   *  zero the moment you check one, which is worse than no count at all. */
  const facet = (patch: Partial<Query>) => runQuery(t, { ...query, ...patch }, scenario);
  const countIf = (patch: Partial<Query>, pred: (i: WorkItem) => boolean) => facet(patch).filter(pred).length;

  const rail = (
    <Rail query={query} write={write} clear={clear} countIf={countIf} />
  );

  const list = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-1.5 text-[12px]">
        <span className="tabular-nums text-muted">
          <b className="text-fg">{rows.length}</b> {rows.length === 1 ? "result" : "results"}
        </span>
        <span className="ml-auto flex items-center gap-1 text-muted">
          Sort
          <select
            value={query.sort}
            onChange={(e) => write({ sort: e.target.value as Query["sort"] })}
            className="rounded border border-line bg-bg px-1 py-0.5 text-[12px]"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => write({ dir: query.dir === "asc" ? "desc" : "asc" })}
            className="touch-min rounded border border-line px-1.5 hover:bg-surface"
            aria-label="Reverse sort"
          >
            {query.dir === "asc" ? "↑" : "↓"}
          </button>
        </span>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 && (
          <li className="px-6 py-12 text-center">
            {scenario === "empty" ? (
              <>
                <p className="text-[14px] font-medium">Nothing to search yet.</p>
                <p className="mt-1 text-[12px] text-muted">The corpus is empty — no work items exist.</p>
              </>
            ) : (
              <>
                <p className="text-[14px] font-medium">{query.q ? `No hits for “${query.q}”.` : "No work items match."}</p>
                <p className="mt-1 text-[12px] text-muted">Every checked box narrows; uncheck one to widen.</p>
                {isFiltered(query) && (
                  <button onClick={clear} className="mt-2 text-[12px] text-primary hover:underline">
                    Reset all filters
                  </button>
                )}
              </>
            )}
          </li>
        )}
        {rows.map((i) => (
          <li key={i.id}>
            <button
              onClick={() => onOpen(i.id)}
              className={`touch-min flex w-full items-center gap-2 border-b border-line px-3 py-2 text-left ${
                selected === i.id ? "bg-primary-soft" : "hover:bg-surface"
              }`}
            >
              <span className="flex shrink-0 items-center gap-1">
                <TypeIcon type={i.type} size={11} />
                <StatusIcon status={i.status} size={12} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] leading-snug">{i.summary}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-faint">
                  <span className="truncate">{i.parentId ? t.byId(i.parentId).summary : "Top level"}</span>
                  <span
                    className={`ml-auto shrink-0 tabular-nums ${
                      query.sort !== "updated" && i.due && i.due < TODAY && (i.status === "Open" || i.status === "In Progress")
                        ? "font-medium text-overdue"
                        : ""
                    }`}
                  >
                    {query.sort === "updated" ? updatedLabel(i) : formatDue(i.due)}
                  </span>
                </span>
              </span>
              <Avatar name={i.assignee} size={18} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  if (compact) {
    return <CompactConsole query={query} write={write} clear={clear} count={rows.length} rail={rail} list={list} />;
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="flex w-[190px] shrink-0 flex-col border-r border-line bg-surface">{rail}</div>
      {list}
    </div>
  );
}

// ── The rail ─────────────────────────────────────────────────────────────

function Rail({
  query,
  write,
  clear,
  countIf,
}: {
  query: Query;
  write: (p: Partial<Query>) => void;
  clear: () => void;
  countIf: (patch: Partial<Query>, pred: (i: WorkItem) => boolean) => number;
}) {
  const t = useTree();
  const { scenario } = useNav();
  const [draft, setDraft] = useState(query.q);
  useEffect(() => setDraft(query.q), [query.q]);
  const active = activeValues(query);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-line p-2">
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            write({ q: e.target.value });
          }}
          placeholder="Keyword"
          className="touch-min w-full rounded border border-line bg-bg px-2 py-1 text-[12px] outline-none focus:border-primary"
        />
        <p className="mt-1 text-[10px] leading-tight text-faint">Summary + description. Searches as you type.</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2 text-[12px]">
        <Facet title="Type">
          {TYPES.map((v) => (
            <Box
              key={v}
              label={v}
              n={countIf({ types: [] }, (i) => i.type === v)}
              on={query.types.includes(v)}
              onClick={() => write({ types: toggle(query.types, v) })}
            />
          ))}
        </Facet>

        <Facet title="Status">
          {STATUSES.map((v) => (
            <Box
              key={v}
              label={v}
              n={countIf({ statuses: [] }, (i) => i.status === v)}
              on={query.statuses.includes(v)}
              onClick={() => write({ statuses: toggle(query.statuses, v as Status) })}
            />
          ))}
        </Facet>

        <Facet title="Assignee">
          {ASSIGNEES.map((v) => (
            <Box
              key={v}
              label={v}
              n={countIf({ assignees: [] }, (i) => (i.assignee ?? "Unassigned") === v)}
              on={query.assignees.includes(v)}
              onClick={() => write({ assignees: toggle(query.assignees, v) })}
            />
          ))}
        </Facet>

        <Facet title="Due">
          {DUE_MODES.map((m) => (
            <Box
              key={m.key}
              radio
              label={m.label}
              on={query.due === m.key}
              onClick={() => write({ due: m.key })}
            />
          ))}
          {(query.due === "before" || query.due === "after" || query.due === "between") && (
            <div className="mt-1 flex flex-col gap-1">
              <input
                type="date"
                value={query.from}
                onChange={(e) => write({ from: e.target.value })}
                className="rounded border border-line bg-bg px-1 py-0.5 text-[11px]"
              />
              {query.due === "between" && (
                <input
                  type="date"
                  value={query.to}
                  onChange={(e) => write({ to: e.target.value })}
                  className="rounded border border-line bg-bg px-1 py-0.5 text-[11px]"
                />
              )}
            </div>
          )}
        </Facet>

        <Facet title="Parent">
          <select
            value={query.parent == null ? "" : String(query.parent)}
            onChange={(e) => write({ parent: e.target.value ? Number(e.target.value) : null })}
            className="touch-min w-full rounded border border-line bg-bg px-1 py-1 text-[12px]"
          >
            <option value="">Any parent</option>
            {typeAhead(t, "", scenario).map((o) => (
              <option key={o.id} value={o.id}>
                {o.type[0]} · {o.summary}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] leading-tight text-faint">
            Direct children only. A Topic will never list Tasks.
          </p>
        </Facet>

        <Facet title="Labels">
          {ALL_LABELS.map((v) => (
            <Box
              key={v}
              label={v}
              n={countIf({ labels: [] }, (i) => i.labels.includes(v))}
              on={query.labels.includes(v)}
              onClick={() => write({ labels: toggle(query.labels, v) })}
            />
          ))}
        </Facet>
      </div>

      <button
        onClick={clear}
        disabled={!active}
        className={`shrink-0 border-t border-line py-2 text-[12px] ${active ? "text-primary hover:bg-raised" : "text-faint"}`}
      >
        Reset {active > 0 ? `(${active})` : ""}
      </button>
    </div>
  );
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function Facet({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-3">
      <h3 className="mb-1 text-[10px] font-semibold tracking-wider text-faint uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Box({
  label,
  n,
  on,
  onClick,
  radio,
}: {
  label: string;
  n?: number;
  on: boolean;
  onClick: () => void;
  radio?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`touch-min flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left hover:bg-raised ${
        n === 0 && !on ? "text-faint" : ""
      }`}
    >
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center border text-[9px] ${
          radio ? "rounded-full" : "rounded-[3px]"
        } ${on ? "border-primary bg-primary text-primary-fg" : "border-line bg-bg"}`}
      >
        {on && !radio ? "✓" : ""}
      </span>
      <span className="truncate">{label}</span>
      {n != null && <span className="ml-auto shrink-0 text-[11px] tabular-nums text-faint">{n}</span>}
    </button>
  );
}

// ── Compact: the rail becomes a sheet, applied live ───────────────────────

function CompactConsole({
  query,
  write,
  clear,
  count,
  rail,
  list,
}: {
  query: Query;
  write: (p: Partial<Query>) => void;
  clear: () => void;
  count: number;
  rail: React.ReactNode;
  list: React.ReactNode;
}) {
  const [sheet, setSheet] = useState(false);
  const t = useTree();
  const chips: { key: string; label: string; off: () => void }[] = [
    ...query.types.map((v) => ({ key: `t${v}`, label: v, off: () => write({ types: toggle(query.types, v) }) })),
    ...query.statuses.map((v) => ({ key: `s${v}`, label: v, off: () => write({ statuses: toggle(query.statuses, v) }) })),
    ...query.assignees.map((v) => ({ key: `a${v}`, label: v, off: () => write({ assignees: toggle(query.assignees, v) }) })),
    ...query.labels.map((v) => ({ key: `l${v}`, label: v, off: () => write({ labels: toggle(query.labels, v) }) })),
    ...(query.parent == null
      ? []
      : [{ key: "p", label: `in ${t.byId(query.parent).summary}`, off: () => write({ parent: null }) }]),
    ...(query.due === "any"
      ? []
      : [{ key: "d", label: DUE_MODES.find((m) => m.key === query.due)!.label, off: () => write({ due: "any" as const }) }]),
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-line px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-semibold tracking-tight">Search</h2>
          <button
            onClick={() => setSheet(true)}
            className="touch-min ml-auto flex items-center gap-1.5 rounded border border-line px-3 text-[13px] text-muted"
          >
            Filters
            {chips.length > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[11px] tabular-nums text-primary-fg">{chips.length}</span>
            )}
          </button>
        </div>
        <input
          value={query.q}
          onChange={(e) => write({ q: e.target.value })}
          placeholder="Keyword"
          className="touch-min mt-2 w-full rounded border border-line px-2 py-1.5 text-[14px] outline-none focus:border-primary"
        />
        {chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {chips.map((c) => (
              <button
                key={c.key}
                onClick={c.off}
                className="flex items-center gap-1 rounded-full border border-primary bg-primary-soft px-2 py-0.5 text-[12px] text-primary"
              >
                {c.label} <span className="text-[11px]">✕</span>
              </button>
            ))}
            <button onClick={clear} className="px-1 text-[12px] text-muted underline">
              clear
            </button>
          </div>
        )}
      </header>

      {list}

      {sheet && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg">
          <div className="flex items-center border-b border-line px-3 py-2">
            <span className="text-[15px] font-semibold">Filters</span>
            <button onClick={() => setSheet(false)} className="touch-min ml-auto px-2 text-[13px] text-muted">
              ✕
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{rail}</div>
          <div className="border-t border-line p-3">
            <button
              onClick={() => setSheet(false)}
              className="touch-min w-full rounded-lg bg-primary py-2.5 text-[15px] font-medium text-primary-fg"
            >
              Show {count} {count === 1 ? "result" : "results"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

SearchB.fullPane = false;
