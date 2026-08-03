// PROTOTYPE — throwaway. ADR-0009's selection rule, computed once and shared by all
// three variants. The *rule* is settled (#7); only how it renders is #17's question,
// so this file is deliberately layout-free.
import { useState } from "react";
import { ME, TODAY, daysOut, type WorkItem } from "./data";
import { unfinished, type Tree } from "./store";

export type Scenario = "full" | "sparse" | "empty";
export type Group = "now" | "soon" | "later";

export type DueRow = {
  item: WorkItem;
  /** Ancestors, outermost first — the breadcrumb, up to three deep. */
  lineage: WorkItem[];
  days: number;
  overdue: boolean;
  group: Group;
};

/**
 * Unfinished, dated inside the horizon, and not covered by an unfinished descendant
 * due on or before its own date — covering judged over the *visible* set, so the
 * assignee filter can never hide a deadline on its own.
 *
 * Open question the prototype exposes: the horizon is forward-only here, so a row 47
 * days late still shows. Reading "within thirty days" symmetrically would drop it.
 */
export function dueRows(t: Tree, mineOnly: boolean, scenario: Scenario): DueRow[] {
  if (scenario === "empty") return [];

  const mine = (i: WorkItem) => !mineOnly || i.assignee === ME || i.assignee === null;
  const dated = t.items.filter(
    (i) => unfinished(i) && i.due != null && daysOut(i.due) <= 30 && mine(i),
  );
  const visibleIds = new Set(dated.map((i) => i.id));

  const uncovered = dated.filter(
    (i) =>
      !t
        .descendants(i.id)
        .some((d) => visibleIds.has(d.id) && d.due! <= i.due!),
  );

  const rows = uncovered
    .sort((a, b) => (a.due! < b.due! ? -1 : a.due! > b.due! ? 1 : a.id - b.id))
    .map((item) => {
      const days = daysOut(item.due!);
      return {
        item,
        lineage: t.ancestors(item.id),
        days,
        overdue: item.due! < TODAY,
        group: (days <= 0 ? "now" : days <= 7 ? "soon" : "later") as Group,
      };
    });

  // "sparse" empties Due Soon and leaves Now with a single row, so the empty-group
  // and near-empty cases can be seen without editing data.
  if (scenario === "sparse") {
    const now = rows.filter((r) => r.group === "now").slice(0, 1);
    return [...now, ...rows.filter((r) => r.group === "later")];
  }

  return rows;
}

export const GROUPS: { key: Group; title: string; window: string }[] = [
  { key: "now", title: "Due Now", window: "today or overdue" },
  { key: "soon", title: "Due Soon", window: "next 7 days" },
  { key: "later", title: "Due Later", window: "the 23 days after" },
];

/** "3 days late", "12 days late" — how overdue reads as words. */
export function lateness(days: number): string {
  const n = -days;
  if (n === 1) return "1 day late";
  if (n < 14) return `${n} days late`;
  if (n < 60) return `${Math.round(n / 7)} weeks late`;
  return `${Math.round(n / 30)} months late`;
}

/** Fri 28 Nov — the absolute form. */
export function absolute(due: string): string {
  return new Date(due + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Today / Tomorrow / in 4 days / 3 days late — the relative form. */
export function relative(days: number): string {
  if (days < 0) return lateness(days);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 14) return `in ${days} days`;
  return `in ${Math.round(days / 7)} weeks`;
}

export function todayLabel(): string {
  return new Date(TODAY + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Shared state only — each variant decides where the control lives and how it reads. */
export function useMine() {
  const [mineOnly, setMineOnly] = useState(true);
  return { mineOnly, setMineOnly };
}
