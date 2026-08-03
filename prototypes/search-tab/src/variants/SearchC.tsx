// PROTOTYPE — throwaway. Variant C — QUERY BAR.
// Stance: the corpus is the default and most searches are one dimension deep, so the
// tab shows *no* filter controls until you ask for one. A keyword box and a single
// "+ Filter" button; each filter you add becomes a chip you can reopen or drop. The
// chip row is the entire state of the query, which means there is exactly one place
// to read it and exactly one thing to build for both widths: the rows are identical
// on a phone and a 27-inch monitor — no table, no sheet, no second layout. Sort is a
// sentence, not a header, since a phone has no headers to click anyway.
import { useEffect, useRef, useState } from "react";
import { TODAY, formatDue, type Status, type Type } from "../data";
import { useNav } from "../proto";
import { Avatar, StatusIcon, TypeIcon } from "../screens";
import type { SearchProps } from "../shell";
import { useTree } from "../store";
import {
  ALL_LABELS,
  ASSIGNEES,
  DIMENSIONS,
  DUE_MODES,
  STATUSES,
  TYPES,
  activeDimensions,
  isFiltered,
  runQuery,
  typeAhead,
  updatedLabel,
  useQuery,
  type Dimension,
  type Query,
} from "../search";

const SORT_PHRASES: { label: string; sort: Query["sort"]; dir: Query["dir"] }[] = [
  { label: "Oldest first", sort: "id", dir: "asc" },
  { label: "Newest first", sort: "id", dir: "desc" },
  { label: "Due soonest", sort: "due", dir: "asc" },
  { label: "Due latest", sort: "due", dir: "desc" },
  { label: "Recently updated", sort: "updated", dir: "desc" },
  { label: "Least recently updated", sort: "updated", dir: "asc" },
];

export default function SearchC({ onOpen, selected, compact }: SearchProps) {
  const t = useTree();
  const { scenario } = useNav();
  const [query, write, clear] = useQuery();
  const rows = runQuery(t, query, scenario);
  const [open, setOpen] = useState<Dimension | "add" | null>(null);
  const active = activeDimensions(query);

  const phrase =
    SORT_PHRASES.find((p) => p.sort === query.sort && p.dir === query.dir)?.label ?? "Oldest first";

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg">
      <header className={`shrink-0 border-b border-line ${compact ? "px-4 pt-3" : "px-5 pt-4"} pb-2.5`}>
        <div className="flex items-center gap-2">
          <span className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-line px-3 py-1.5 focus-within:border-primary">
            <span className="text-[15px] text-faint">⌕</span>
            <input
              value={query.q}
              onChange={(e) => write({ q: e.target.value })}
              placeholder="Search all work items"
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
            />
            {query.q && (
              <button onClick={() => write({ q: "" })} className="text-[14px] text-faint hover:text-fg">
                ✕
              </button>
            )}
          </span>
          <Adder open={open === "add"} setOpen={(o) => setOpen(o ? "add" : null)} used={active} onPick={(d) => setOpen(d)} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {active.map((d) => (
            <Chip
              key={d}
              dim={d}
              query={query}
              write={write}
              open={open === d}
              setOpen={(o) => setOpen(o ? d : null)}
            />
          ))}
          {active.length > 1 && (
            <button onClick={clear} className="px-1 text-[12px] text-muted hover:text-fg hover:underline">
              clear all
            </button>
          )}
        </div>

        <div className="mt-2 flex items-baseline gap-2 text-[12px]">
          <span className="tabular-nums text-muted">
            <b className="text-fg">{rows.length}</b> {rows.length === 1 ? "work item" : "work items"}
            {isFiltered(query) ? "" : " · everything"}
          </span>
          <SortMenu phrase={phrase} write={write} />
        </div>
      </header>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 && (
          <li className={`${compact ? "px-6" : "px-8"} py-14 text-center`}>
            {scenario === "empty" ? (
              <>
                <p className="text-[15px] font-medium">No work items yet</p>
                <p className="mt-1 text-[13px] text-muted">Nothing has been created, so there is nothing to search.</p>
              </>
            ) : (
              <>
                <p className="text-[15px] font-medium">
                  {query.q ? `Nothing mentions “${query.q}”` : "Nothing matches"}
                </p>
                <p className="mt-1 text-[13px] text-muted">
                  {active.length > 0 && query.q
                    ? "Try dropping a filter, or fewer words."
                    : active.length > 0
                      ? "Try dropping a filter."
                      : "Keyword matches every word against the summary and description."}
                </p>
              </>
            )}
          </li>
        )}

        {rows.map((i) => (
          <li key={i.id}>
            <button
              onClick={() => onOpen(i.id)}
              className={`touch-min flex w-full items-center gap-3 border-b border-line py-2.5 text-left ${
                compact ? "px-4" : "px-5"
              } ${selected === i.id ? "bg-primary-soft" : "hover:bg-surface"}`}
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[11px] text-faint">
                  <TypeIcon type={i.type} size={10} />
                  <span className="truncate">{i.parentId ? t.byId(i.parentId).summary : `${i.type} · top level`}</span>
                </span>
                <span className="mt-0.5 block truncate text-[14px] leading-snug">{i.summary}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2.5 text-[12px] text-muted">
                <span
                  className={`tabular-nums ${
                    query.sort !== "updated" && i.due && i.due < TODAY && (i.status === "Open" || i.status === "In Progress")
                      ? "font-medium text-overdue"
                      : ""
                  }`}
                >
                  {query.sort === "updated" ? updatedLabel(i) : formatDue(i.due)}
                </span>
                <StatusIcon status={i.status} size={13} />
                <Avatar name={i.assignee} size={19} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Adding a filter: one menu of dimensions, then the dimension's own menu ─

const DIM_LABEL: Record<Dimension, string> = {
  type: "Type",
  status: "Status",
  assignee: "Assignee",
  parent: "Parent",
  due: "Due date",
  labels: "Labels",
};

function Adder({
  open,
  setOpen,
  used,
  onPick,
}: {
  open: boolean;
  setOpen: (o: boolean) => void;
  used: Dimension[];
  onPick: (d: Dimension) => void;
}) {
  const ref = useOutside(() => setOpen(false));
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="touch-min rounded-lg border border-line px-3 py-1.5 text-[13px] text-muted hover:bg-surface"
      >
        + Filter
      </button>
      {open && (
        <div className="absolute top-full right-0 z-40 mt-1 w-44 rounded-lg border border-line bg-bg p-1 shadow-lg shadow-black/10">
          {DIMENSIONS.map((d) => (
            <button
              key={d}
              onClick={() => onPick(d)}
              className="touch-min flex w-full items-center rounded px-2 py-1.5 text-left text-[13px] hover:bg-surface"
            >
              {DIM_LABEL[d]}
              {used.includes(d) && <span className="ml-auto text-[11px] text-faint">on</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  dim,
  query,
  write,
  open,
  setOpen,
}: {
  dim: Dimension;
  query: Query;
  write: (p: Partial<Query>) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
}) {
  const ref = useOutside(() => setOpen(false));
  const t = useTree();
  const { scenario } = useNav();

  const summary = (() => {
    switch (dim) {
      case "type":
        return query.types.join(" or ");
      case "status":
        return query.statuses.join(" or ");
      case "assignee":
        return query.assignees.join(" or ");
      case "labels":
        return query.labels.join(" or ");
      case "parent":
        return query.parent == null ? "" : t.byId(query.parent).summary;
      case "due": {
        const m = DUE_MODES.find((x) => x.key === query.due)!.label;
        if (query.due === "between") return `${query.from || "…"} – ${query.to || "…"}`;
        if (query.due === "before" || query.due === "after") return `${m.toLowerCase()} ${query.from || "…"}`;
        return m;
      }
    }
  })();

  const off = () => {
    const wipe: Partial<Query> = {
      type: { types: [] },
      status: { statuses: [] },
      assignee: { assignees: [] },
      labels: { labels: [] },
      parent: { parent: null },
      due: { due: "any" as const, from: "", to: "" },
    }[dim];
    write(wipe);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <span className="flex items-center rounded-full border border-primary/40 bg-primary-soft text-[12px] text-primary">
        <button onClick={() => setOpen(!open)} className="touch-min max-w-[260px] truncate py-1 pr-1 pl-2.5">
          <span className="font-medium">{DIM_LABEL[dim]}</span>
          <span className="opacity-80">: {summary || "any"}</span>
        </button>
        <button onClick={off} className="touch-min py-1 pr-2.5 pl-1 opacity-70 hover:opacity-100" aria-label={`Remove ${dim} filter`}>
          ✕
        </button>
      </span>
      {open && (
        <div className="absolute top-full left-0 z-40 mt-1 w-64 rounded-lg border border-line bg-bg p-1 shadow-lg shadow-black/10">
          {dim === "type" && (
            <Options
              options={TYPES}
              chosen={query.types}
              onToggle={(v) => write({ types: toggle(query.types, v as Type) })}
            />
          )}
          {dim === "status" && (
            <Options
              options={STATUSES}
              chosen={query.statuses}
              onToggle={(v) => write({ statuses: toggle(query.statuses, v as Status) })}
            />
          )}
          {dim === "assignee" && (
            <Options options={ASSIGNEES} chosen={query.assignees} onToggle={(v) => write({ assignees: toggle(query.assignees, v) })} />
          )}
          {dim === "labels" && (
            <Options options={ALL_LABELS} chosen={query.labels} onToggle={(v) => write({ labels: toggle(query.labels, v) })} />
          )}
          {dim === "parent" && (
            <div>
              <p className="px-2 pt-1 pb-1.5 text-[11px] leading-tight text-faint">
                One rung only — a Topic's children are Projects, never Tasks.
              </p>
              <ul className="max-h-64 overflow-y-auto">
                {typeAhead(t, "", scenario).map((o) => (
                  <li key={o.id}>
                    <button
                      onClick={() => write({ parent: o.id })}
                      className={`touch-min flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] hover:bg-surface ${
                        query.parent === o.id ? "bg-primary-soft text-primary" : ""
                      }`}
                    >
                      <TypeIcon type={o.type} size={11} />
                      <span className="truncate">{o.summary}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {dim === "due" && (
            <div>
              {DUE_MODES.map((m) => (
                <div key={m.key}>
                  <button
                    onClick={() => write({ due: m.key })}
                    className="touch-min flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] hover:bg-surface"
                  >
                    <span
                      className={`h-3.5 w-3.5 shrink-0 rounded-full border ${
                        query.due === m.key ? "border-[4px] border-primary" : "border-line"
                      }`}
                    />
                    {m.label}
                  </button>
                  {query.due === m.key && (m.key === "before" || m.key === "after" || m.key === "between") && (
                    <div className="flex flex-wrap items-center gap-1 pb-2 pl-8">
                      <input
                        type="date"
                        value={query.from}
                        onChange={(e) => write({ from: e.target.value })}
                        className="rounded border border-line px-1.5 py-1 text-[12px]"
                      />
                      {m.key === "between" && (
                        <input
                          type="date"
                          value={query.to}
                          onChange={(e) => write({ to: e.target.value })}
                          className="rounded border border-line px-1.5 py-1 text-[12px]"
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Options({ options, chosen, onToggle }: { options: string[]; chosen: string[]; onToggle: (v: string) => void }) {
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

function SortMenu({ phrase, write }: { phrase: string; write: (p: Partial<Query>) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useOutside(() => setOpen(false));
  return (
    <span ref={ref} className="relative ml-auto">
      <button onClick={() => setOpen(!open)} className="text-[12px] text-muted hover:text-fg">
        {phrase} <span className="text-[9px]">▾</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 z-40 mt-1 w-52 rounded-lg border border-line bg-bg p-1 shadow-lg shadow-black/10">
          {SORT_PHRASES.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                write({ sort: p.sort, dir: p.dir });
                setOpen(false);
              }}
              className={`touch-min flex w-full rounded px-2 py-1.5 text-left text-[13px] hover:bg-surface ${
                p.label === phrase ? "font-medium text-primary" : ""
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function useOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement & HTMLSpanElement>(null);
  useEffect(() => {
    const on = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    window.addEventListener("mousedown", on);
    return () => window.removeEventListener("mousedown", on);
  });
  return ref;
}

SearchC.fullPane = false;
