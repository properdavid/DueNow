import { eq } from "drizzle-orm";

import type { DatabaseClient } from "~/db/client";
import { users, workItems, type WorkItemStatus, type WorkItemType } from "~/db/schema";
import { ancestorsForWorkItem, planStartCascade, type TreeWorkItem } from "./tree";

export interface WorkItemsTreeMember {
  id: number;
  name: string;
  email: string;
}

export interface WorkItemsTreeRow extends TreeWorkItem {
  description: string;
  assigneeId: number | null;
  assignee: WorkItemsTreeMember | null;
}

export interface WorkItemsTreeReadModel {
  rows: WorkItemsTreeRow[];
  ancestorIds: number[];
  selectedId: number | null;
  hasAnyWorkItems: boolean;
}

interface WorkItemSelectRow {
  id: number;
  type: WorkItemType;
  parentId: number | null;
  status: WorkItemStatus;
  dueDate: string | null;
  summary: string;
  description: string;
  assigneeId: number | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
}

export function loadWorkItemsTree(database: DatabaseClient, selectedId: number | null): WorkItemsTreeReadModel {
  const rows = database.db
    .select({
      id: workItems.id,
      type: workItems.type,
      parentId: workItems.parentId,
      status: workItems.status,
      dueDate: workItems.dueDate,
      summary: workItems.summary,
      description: workItems.description,
      assigneeId: workItems.assigneeId,
      assigneeName: users.name,
      assigneeEmail: users.email,
    })
    .from(workItems)
    .leftJoin(users, eq(workItems.assigneeId, users.id))
    .orderBy(workItems.id)
    .all() as WorkItemSelectRow[];

  const treeRows = rows.map(toTreeRow);
  const selected = selectedId === null ? null : treeRows.find((row) => row.id === selectedId);
  if (selectedId !== null && !selected) {
    throw new Response("Work Item not found", { status: 404 });
  }

  return {
    rows: treeRows,
    ancestorIds: selectedId === null ? [] : ancestorsForWorkItem(treeRows, selectedId).map((row) => row.id),
    selectedId,
    hasAnyWorkItems: treeRows.length > 0,
  };
}

function toTreeRow(row: WorkItemSelectRow): WorkItemsTreeRow {
  return {
    id: row.id,
    type: row.type,
    parentId: row.parentId,
    status: row.status,
    dueDate: row.dueDate,
    summary: row.summary,
    description: row.description,
    assigneeId: row.assigneeId,
    assignee:
      row.assigneeId === null || row.assigneeName === null || row.assigneeEmail === null
        ? null
        : { id: row.assigneeId, name: row.assigneeName, email: row.assigneeEmail },
  };
}

export function startWorkItem(database: DatabaseClient, id: number, actorId: number, now = Date.now()) {
  return database.sqlite.transaction(() => {
    const rows = database.db
      .select({
        id: workItems.id,
        type: workItems.type,
        parentId: workItems.parentId,
        status: workItems.status,
        dueDate: workItems.dueDate,
        summary: workItems.summary,
      })
      .from(workItems)
      .orderBy(workItems.id)
      .all();

    const target = rows.find((row) => row.id === id);
    if (!target) {
      throw new Response("Work Item not found", { status: 404 });
    }
    if (target.status !== "open") {
      return { ok: true as const, changed: 0 };
    }

    const changes = planStartCascade(rows, id);
    if (changes.length === 0) {
      return { ok: true as const, changed: 0 };
    }

    database.sqlite
      .prepare(`UPDATE work_items SET status = 'in_progress', updatedAt = ?, updatedBy = ? WHERE id IN (${changes.map(() => "?").join(", ")})`)
      .run(now, actorId, ...changes.map((change) => change.id));

    return { ok: true as const, changed: changes.length };
  })();
}
