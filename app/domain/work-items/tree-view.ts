import type { WorkItemStatus } from "~/db/schema";
import type { WorkItemsTreeRow } from "./work-items.server";

export interface WorkItemsTreeState {
  expandedIds: ReadonlySet<number>;
  revealedParents: ReadonlySet<number | null>;
}

export type WorkItemsTreeLine =
  | { kind: "row"; row: WorkItemsTreeRow; level: number; hasChildren: boolean; isExpanded: boolean; settledCount: number }
  | { kind: "settledReveal"; parentId: number | null; level: number; count: number };

type ChildrenByParent = Map<number | null, WorkItemsTreeRow[]>;

export function workItemsTreeLines(rows: readonly WorkItemsTreeRow[], state: WorkItemsTreeState): WorkItemsTreeLine[] {
  const groups = groupTreeRows(rows);
  const counts = settledDescendantCountsFromGroups(groups, rows);
  const lines: WorkItemsTreeLine[] = [];

  function visit(parentId: number | null, level: number) {
    const siblings = groups.get(parentId) ?? [];
    const showSettled = state.revealedParents.has(parentId);
    const { settled, visibleRows } = visibleSiblingRows(siblings, showSettled);
    for (const row of visibleRows) {
      const hasChildren = (groups.get(row.id) ?? []).length > 0;
      const isExpanded = state.expandedIds.has(row.id);
      lines.push({ kind: "row", row, level, hasChildren, isExpanded, settledCount: isExpanded ? 0 : (counts.get(row.id) ?? 0) });
      if (hasChildren && isExpanded) visit(row.id, level + 1);
    }
    if (settled.length > 0 && !showSettled) lines.push({ kind: "settledReveal", parentId, level, count: settled.length });
  }

  visit(null, 0);
  return lines;
}

export function expandableRowIds(rows: readonly WorkItemsTreeRow[]) {
  const groups = groupTreeRows(rows);
  return rows.filter((row) => (groups.get(row.id) ?? []).length > 0).map((row) => row.id);
}

export function rootRows(rows: readonly WorkItemsTreeRow[]) {
  return groupTreeRows(rows).get(null) ?? [];
}

export function rootIsAllSettled(rootRows: readonly WorkItemsTreeRow[], hasAnyWorkItems: boolean) {
  return hasAnyWorkItems && rootRows.length > 0 && rootRows.every((row) => isTerminalStatus(row.status));
}

export function terminalParentIdsInPath(rows: readonly WorkItemsTreeRow[], selectedPath: ReadonlySet<number>) {
  return rows.filter((row) => selectedPath.has(row.id) && isTerminalStatus(row.status)).map((row) => row.parentId);
}

function groupTreeRows(rows: readonly WorkItemsTreeRow[]): ChildrenByParent {
  const groups: ChildrenByParent = new Map();
  for (const row of rows) {
    const siblings = groups.get(row.parentId) ?? [];
    siblings.push(row);
    groups.set(row.parentId, siblings);
  }
  for (const siblings of groups.values()) siblings.sort((left, right) => left.id - right.id);
  return groups;
}

function settledDescendantCountsFromGroups(groups: ChildrenByParent, rows: readonly WorkItemsTreeRow[]) {
  const counts = new Map<number, number>();
  function visit(id: number): number {
    let count = 0;
    for (const child of groups.get(id) ?? []) {
      if (isTerminalStatus(child.status)) count += 1;
      count += visit(child.id);
    }
    counts.set(id, count);
    return count;
  }
  for (const row of rows) visit(row.id);
  return counts;
}

function visibleSiblingRows(siblings: readonly WorkItemsTreeRow[], showSettled: boolean) {
  const unfinished = siblings.filter((row) => !isTerminalStatus(row.status));
  const settled = siblings.filter((row) => isTerminalStatus(row.status));
  return {
    settled,
    visibleRows: showSettled ? [...unfinished, ...settled].sort((left, right) => left.id - right.id) : unfinished,
  };
}

export function isTerminalStatus(status: WorkItemStatus) {
  return status === "completed" || status === "closed";
}
