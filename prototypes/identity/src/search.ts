// PROTOTYPE — throwaway. #18's query model, made real enough that the filter bar in
// each variant is filtering something. ADR-0012: values OR within a dimension,
// dimensions AND; parent means the *immediate* parent, one rung only. ADR-0013:
// keyword is FTS over Summary + Description, ANDing terms, never Comments.
import { useSearchParams } from "react-router-dom";
import { PEOPLE, TODAY, type Status, type Type, type WorkItem } from "./data";
import type { Tree } from "./store";
import type { Scenario } from "./due";

export const TYPES: Type[] = ["Topic", "Project", "Task", "Subtask"];
export const STATUSES: Status[] = ["Open", "In Progress", "Completed", "Closed"];
export const ASSIGNEES = [...PEOPLE, "Unassigned"];
export const ALL_LABELS = ["errand", "money", "waiting", "weekend", "urgent", "phone", "seasonal"];

export type DueMode = "any" | "overdue" | "before" | "after" | "between" | "none";
export const DUE_MODES: { key: DueMode; label: string }[] = [
  { key: "any", label: "Any" },
  { key: "overdue", label: "Overdue" },
  { key: "before", label: "Before" },
  { key: "after", label: "After" },
  { key: "between", label: "Between" },
  { key: "none", label: "No due date" },
];

/** #18 widened #9's three sorts: every column the table prints is sortable, because a
 *  header that does nothing when clicked is indistinguishable from one that does. */
export type Sort = "id" | "summary" | "parent" | "assignee" | "status" | "due" | "updated";
export const SORTS: { key: Sort; label: string }[] = [
  { key: "id", label: "Created" },
  { key: "summary", label: "Summary" },
  { key: "parent", label: "Parent" },
  { key: "assignee", label: "Assignee" },
  { key: "status", label: "Status" },
  { key: "due", label: "Due date" },
  { key: "updated", label: "Updated" },
];

/** Status sorts down the ladder, never alphabetically — Closed before Completed before
 *  In Progress is nobody's idea of order. */
const STATUS_ORDER: Record<Status, number> = { Open: 0, "In Progress": 1, Completed: 2, Closed: 3 };

export type Query = {
  q: string;
  types: Type[];
  statuses: Status[];
  assignees: string[];
  parent: number | null;
  due: DueMode;
  from: string;
  to: string;
  labels: string[];
  sort: Sort;
  dir: "asc" | "desc";
};

export const EMPTY: Query = {
  q: "",
  types: [],
  statuses: [],
  assignees: [],
  parent: null,
  due: "any",
  from: "",
  to: "",
  labels: [],
  sort: "id",
  dir: "asc",
};

/** Every dimension the filter bar exposes, in bar order — the variants disagree
 *  about how these are laid out, never about what they are. */
export const DIMENSIONS = ["type", "status", "assignee", "parent", "due", "labels"] as const;
export type Dimension = (typeof DIMENSIONS)[number];

// ── URL state ────────────────────────────────────────────────────────────
// Every change is a navigation (ADR-0012 — the query lives in the URL and a search
// is shareable and back-button-able).

const list = (s: string | null) => (s ? s.split(",").filter(Boolean) : []);

export function useQuery(): [Query, (patch: Partial<Query>) => void, () => void] {
  const [params, setParams] = useSearchParams();

  const query: Query = {
    q: params.get("q") ?? "",
    types: list(params.get("type")) as Type[],
    statuses: list(params.get("status")) as Status[],
    assignees: list(params.get("who")),
    parent: params.get("parent") ? Number(params.get("parent")) : null,
    due: (params.get("due") ?? "any") as DueMode,
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    labels: list(params.get("labels")),
    sort: (params.get("sort") ?? "id") as Sort,
    dir: (params.get("dir") ?? "asc") as "asc" | "desc",
  };

  const write = (patch: Partial<Query>) => {
    const next = { ...query, ...patch };
    const p = new URLSearchParams(params);
    const put = (k: string, v: string) => (v ? p.set(k, v) : p.delete(k));
    put("q", next.q);
    put("type", next.types.join(","));
    put("status", next.statuses.join(","));
    put("who", next.assignees.join(","));
    put("parent", next.parent == null ? "" : String(next.parent));
    put("due", next.due === "any" ? "" : next.due);
    put("from", next.due === "before" || next.due === "after" || next.due === "between" ? next.from : "");
    put("to", next.due === "between" ? next.to : "");
    put("labels", next.labels.join(","));
    put("sort", next.sort === "id" ? "" : next.sort);
    put("dir", next.dir === "asc" ? "" : next.dir);
    setParams(p, { replace: false });
  };

  const clear = () => {
    const p = new URLSearchParams(params);
    ["q", "type", "status", "who", "parent", "due", "from", "to", "labels"].forEach((k) => p.delete(k));
    setParams(p, { replace: false });
  };

  return [query, write, clear];
}

/** Which dimensions are currently narrowing the list — the badge count on phone,
 *  and the "is this control doing anything" test on desktop. */
export function activeDimensions(q: Query): Dimension[] {
  const out: Dimension[] = [];
  if (q.types.length) out.push("type");
  if (q.statuses.length) out.push("status");
  if (q.assignees.length) out.push("assignee");
  if (q.parent != null) out.push("parent");
  if (q.due !== "any") out.push("due");
  if (q.labels.length) out.push("labels");
  return out;
}

export function activeValues(q: Query): number {
  return (
    q.types.length +
    q.statuses.length +
    q.assignees.length +
    (q.parent == null ? 0 : 1) +
    (q.due === "any" ? 0 : 1) +
    q.labels.length
  );
}

// ── The corpus ───────────────────────────────────────────────────────────

/** The data switch on the black strip: the whole corpus, a household that has barely
 *  started, or a brand-new deployment with nothing in it at all. */
export function corpus(t: Tree, scenario: Scenario): WorkItem[] {
  if (scenario === "empty") return [];
  if (scenario === "sparse") return t.items.filter((i) => i.id <= 9);
  return t.items;
}

/** A stand-in for updatedAt, which the seed does not carry: deterministic, and
 *  deliberately not the same order as id, so the sort visibly does something. */
export function updatedAt(i: WorkItem): number {
  return (i.id * 7919) % 1000;
}

export function updatedLabel(i: WorkItem): string {
  const d = Math.floor(updatedAt(i) / 33);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.round(d / 7)}w ago`;
  return `${Math.round(d / 30)}mo ago`;
}

// ── Running the query ────────────────────────────────────────────────────

const haystack = (i: WorkItem) => `${i.summary} ${i.description ?? ""}`.toLowerCase();

export function matchesKeyword(i: WorkItem, q: string): boolean {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const hay = haystack(i);
  return terms.every((t) => hay.includes(t));
}

function matchesDue(i: WorkItem, q: Query): boolean {
  switch (q.due) {
    case "any":
      return true;
    case "none":
      return i.due == null;
    case "overdue":
      return i.due != null && i.due < TODAY && (i.status === "Open" || i.status === "In Progress");
    case "before":
      return i.due != null && (!q.from || i.due <= q.from);
    case "after":
      return i.due != null && (!q.from || i.due >= q.from);
    case "between":
      return i.due != null && (!q.from || i.due >= q.from) && (!q.to || i.due <= q.to);
  }
}

export function runQuery(t: Tree, query: Query, scenario: Scenario): WorkItem[] {
  const rows = corpus(t, scenario).filter((i) => {
    if (!matchesKeyword(i, query.q)) return false;
    if (query.types.length && !query.types.includes(i.type)) return false;
    if (query.statuses.length && !query.statuses.includes(i.status)) return false;
    if (query.assignees.length) {
      const who = i.assignee ?? "Unassigned";
      if (!query.assignees.includes(who)) return false;
    }
    // ADR-0012: parent means parent — one rung, never the subtree.
    if (query.parent != null && i.parentId !== query.parent) return false;
    if (!matchesDue(i, query)) return false;
    if (query.labels.length && !query.labels.some((l) => i.labels.includes(l))) return false;
    return true;
  });

  const sign = query.dir === "asc" ? 1 : -1;
  const parentOf = (i: WorkItem) => (i.parentId == null ? "" : t.byId(i.parentId).summary);
  return rows.sort((a, b) => {
    if (query.sort === "summary") {
      const d = a.summary.localeCompare(b.summary);
      return d !== 0 ? d * sign : a.id - b.id;
    }
    if (query.sort === "parent") {
      // Top-level items have no parent to compare — they sort last, like undated rows.
      const pa = parentOf(a);
      const pb = parentOf(b);
      if (!pa && !pb) return a.id - b.id;
      if (!pa) return 1;
      if (!pb) return -1;
      const d = pa.localeCompare(pb);
      return d !== 0 ? d * sign : a.id - b.id;
    }
    if (query.sort === "assignee") {
      // Unassigned is a real state, and it sorts last rather than under "U".
      const aa = a.assignee;
      const bb = b.assignee;
      if (!aa && !bb) return a.id - b.id;
      if (!aa) return 1;
      if (!bb) return -1;
      const d = aa.localeCompare(bb);
      return d !== 0 ? d * sign : a.id - b.id;
    }
    if (query.sort === "status") {
      const d = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      return d !== 0 ? d * sign : a.id - b.id;
    }
    if (query.sort === "due") {
      // Undated sort last in both directions — never hidden, never in the way.
      if (!a.due && !b.due) return a.id - b.id;
      if (!a.due) return 1;
      if (!b.due) return -1;
      if (a.due !== b.due) return a.due < b.due ? -sign : sign;
      return a.id - b.id;
    }
    if (query.sort === "updated") {
      const d = updatedAt(a) - updatedAt(b);
      return d !== 0 ? d * sign : a.id - b.id;
    }
    return (a.id - b.id) * sign;
  });
}

/** Whether the query would be empty for *everyone* — used to tell "no hits" apart
 *  from "nothing here yet". */
export function isFiltered(q: Query): boolean {
  return q.q.trim().length > 0 || activeDimensions(q).length > 0;
}

export function typeAhead(t: Tree, term: string, scenario: Scenario): WorkItem[] {
  const rows = corpus(t, scenario).filter((i) => i.type !== "Subtask");
  if (!term.trim()) return rows.slice(0, 40);
  return rows.filter((i) => i.summary.toLowerCase().includes(term.toLowerCase())).slice(0, 40);
}
