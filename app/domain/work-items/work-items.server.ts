import { eq } from "drizzle-orm";

import type { DatabaseClient } from "~/db/client";
import { labels, users, workItems, workItemStatuses, workItemTypes, type WorkItemStatus, type WorkItemType } from "~/db/schema";
import {
  ancestorsForWorkItem,
  parentTypeForWorkItemType,
  planCreateStatusEffects,
  planStartCascade,
  type TerminalAncestorNotice,
  type TreeWorkItem,
} from "./tree";

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

export interface WorkItemDetailReadModel {
  item: WorkItemsTreeRow;
  breadcrumb: { id: number; label: string; type: WorkItemType }[];
  labels: { id: number; name: string }[];
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

export interface ParentCandidate extends TreeWorkItem {
  lineage: string;
  terminalAncestors: TerminalAncestorNotice[];
  startCascade: { id: number; summary: string }[];
}

export interface CreateWorkItemInput {
  type: WorkItemType;
  summary: string;
  parentId: number | null;
  description: string;
  dueDate: string | null;
  status: WorkItemStatus;
  assigneeId: number | null;
  labelIds: number[];
}

export type CreateWorkItemResult =
  | { ok: true; id: number }
  | { ok: false; error: { field?: string; message: string } };

export type UpdateWorkItemResult = { ok: true } | { ok: false; error: { field?: string; message: string } };

export function loadWorkItemsTree(database: DatabaseClient, selectedId: number | null): WorkItemsTreeReadModel {
  const treeRows = loadWorkItemRows(database);
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

export function loadWorkItemDetail(database: DatabaseClient, id: number): WorkItemDetailReadModel {
  const rows = loadWorkItemRows(database);
  const item = rows.find((row) => row.id === id);
  if (!item) {
    throw new Response("Work Item not found", { status: 404 });
  }
  const selectedLabels = database.sqlite
    .prepare(
      "SELECT labels.id, labels.name FROM labels INNER JOIN work_item_labels ON work_item_labels.labelId = labels.id WHERE work_item_labels.workItemId = ? ORDER BY lower(labels.name)",
    )
    .all(id) as { id: number; name: string }[];

  return {
    item,
    breadcrumb: [...ancestorsForWorkItem(rows, id).map(({ id, summary: label, type }) => ({ id, label, type })), { id: item.id, label: typeLabel(item.type), type: item.type }],
    labels: selectedLabels,
  };
}

export function loadParentCandidates(database: DatabaseClient, type: WorkItemType, query: string): ParentCandidate[] {
  const parentType = parentTypeForWorkItemType(type);
  if (parentType === null) {
    return [];
  }

  const rows = loadTreeRows(database);
  const candidateRows = database.sqlite
    .prepare("SELECT id FROM work_items WHERE type = ? AND summary LIKE ? ESCAPE '\\' ORDER BY id")
    .all(parentType, `%${escapeLike(query.trim())}%`) as { id: number }[];
  const ids = new Set(candidateRows.map((row) => row.id));
  return rows
    .filter((row) => ids.has(row.id))
    .map((row) => {
      const ancestors = ancestorsForWorkItem(rows, row.id);
      const startCascade = planCreateStatusEffects(rows, row.id, "in_progress").statusChanges
        .map((change) => rows.find((candidate) => candidate.id === change.id))
        .filter((candidate): candidate is TreeWorkItem => Boolean(candidate))
        .map(({ id, summary }) => ({ id, summary }));
      const terminalAncestors = planCreateStatusEffects(rows, row.id, "open")
        .reopenStatusChanges.map((change) => rows.find((candidate) => candidate.id === change.id))
        .filter((candidate): candidate is TreeWorkItem & { status: "completed" | "closed" } => Boolean(candidate))
        .map(({ id, summary, status }) => ({ id, summary, status }));
      return {
        ...row,
        lineage: [...ancestors.map((ancestor) => ancestor.summary), row.summary].join(" › "),
        terminalAncestors,
        startCascade,
      };
    });
}

export function createWorkItem(
  database: DatabaseClient,
  input: CreateWorkItemInput,
  actorId: number,
  now = Date.now(),
): CreateWorkItemResult {
  const validation = validateCreateWorkItemInput(database, input);
  if (validation) {
    return { ok: false, error: validation };
  }

  return database.sqlite.transaction(() => {
    const rows = loadTreeRows(database);
    const parentType = parentTypeForWorkItemType(input.type);
    if (parentType === null && input.parentId !== null) {
      return { ok: false as const, error: { field: "parentId", message: "A Topic has no Parent." } };
    }
    if (parentType !== null) {
      const parent = rows.find((row) => row.id === input.parentId);
      if (!parent || parent.type !== parentType) {
        return { ok: false as const, error: { field: "parentId", message: "Choose a valid Parent." } };
      }
    }

    const result = database.sqlite
      .prepare(
        "INSERT INTO work_items (type, parentId, parentType, summary, description, assigneeId, status, dueDate, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
      )
      .get(
        input.type,
        input.parentId,
        parentType,
        input.summary.trim(),
        input.description.trim(),
        input.assigneeId,
        input.status,
        input.dueDate,
        now,
        now,
        actorId,
        actorId,
      ) as { id: number };

    const statusEffects = planCreateStatusEffects(rows, input.parentId, input.status);
    applyStatusChanges(database, [...statusEffects.statusChanges, ...statusEffects.reopenStatusChanges], actorId, now);

    const insertLabel = database.sqlite.prepare("INSERT INTO work_item_labels (workItemId, labelId) VALUES (?, ?)");
    for (const labelId of input.labelIds) {
      insertLabel.run(result.id, labelId);
    }

    return { ok: true as const, id: result.id };
  })();
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
    const rows = loadTreeRows(database);
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

export function updateWorkItemSummary(database: DatabaseClient, id: number, summary: string, actorId: number, now = Date.now()): UpdateWorkItemResult {
  ensureWorkItemExists(database, id);
  const trimmed = summary.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: { field: "summary", message: "Summary is required." } };
  }
  if (trimmed.length > 200) {
    return { ok: false, error: { field: "summary", message: "Summary must be 200 characters or fewer." } };
  }
  database.sqlite.prepare("UPDATE work_items SET summary = ?, updatedAt = ?, updatedBy = ? WHERE id = ?").run(trimmed, now, actorId, id);
  return { ok: true };
}

export function updateWorkItemDescription(database: DatabaseClient, id: number, description: string, actorId: number, now = Date.now()): UpdateWorkItemResult {
  ensureWorkItemExists(database, id);
  const trimmed = description.trim();
  if (trimmed.length > 20_000) {
    return {
      ok: false,
      error: { field: "description", message: `Description is too long (${trimmed.length.toLocaleString("en-US")} characters, limit 20,000).` },
    };
  }
  const storedDescription = trimmed.length === 0 ? "" : description;
  database.sqlite.prepare("UPDATE work_items SET description = ?, updatedAt = ?, updatedBy = ? WHERE id = ?").run(storedDescription, now, actorId, id);
  return { ok: true };
}

export function updateWorkItemAssignee(database: DatabaseClient, id: number, assigneeId: number | null, actorId: number, now = Date.now()): UpdateWorkItemResult {
  ensureWorkItemExists(database, id);
  if (assigneeId !== null) {
    const assignee = database.sqlite.prepare("SELECT id FROM users WHERE id = ?").get(assigneeId);
    if (!assignee) {
      return { ok: false, error: { field: "assigneeId", message: "Choose a valid Assignee." } };
    }
  }
  database.sqlite.prepare("UPDATE work_items SET assigneeId = ?, updatedAt = ?, updatedBy = ? WHERE id = ?").run(assigneeId, now, actorId, id);
  return { ok: true };
}

export function updateWorkItemDueDate(database: DatabaseClient, id: number, dueDate: string | null, actorId: number, now = Date.now()): UpdateWorkItemResult {
  ensureWorkItemExists(database, id);
  if (dueDate !== null && !isWholeDay(dueDate)) {
    return { ok: false, error: { field: "dueDate", message: "Due Date must be a calendar day." } };
  }
  database.sqlite.prepare("UPDATE work_items SET dueDate = ?, updatedAt = ?, updatedBy = ? WHERE id = ?").run(dueDate, now, actorId, id);
  return { ok: true };
}

function ensureWorkItemExists(database: DatabaseClient, id: number) {
  const row = database.sqlite.prepare("SELECT id FROM work_items WHERE id = ?").get(id);
  if (!row) {
    throw new Response("Work Item not found", { status: 404 });
  }
}

function loadWorkItemRows(database: DatabaseClient): WorkItemsTreeRow[] {
  return (database.db
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
    .all() as WorkItemSelectRow[]).map(toTreeRow);
}

function loadTreeRows(database: DatabaseClient): TreeWorkItem[] {
  return database.db
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
}

function typeLabel(type: WorkItemType) {
  return { topic: "Topic", project: "Project", task: "Task", subtask: "Subtask" }[type];
}

function validateCreateWorkItemInput(database: DatabaseClient, input: CreateWorkItemInput): { field?: string; message: string } | null {
  if (!workItemTypes.includes(input.type)) {
    return { field: "type", message: "Choose a valid Type." };
  }
  const summary = input.summary.trim();
  if (summary.length === 0) {
    return { field: "summary", message: "Summary is required." };
  }
  if (summary.length > 200) {
    return { field: "summary", message: "Summary must be 200 characters or fewer." };
  }
  if (input.description.trim().length > 20_000) {
    return { field: "description", message: "Description must be 20,000 characters or fewer." };
  }
  if (!workItemStatuses.includes(input.status)) {
    return { field: "status", message: "Choose a valid Status." };
  }
  if (input.dueDate !== null && !isWholeDay(input.dueDate)) {
    return { field: "dueDate", message: "Due Date must be a calendar day." };
  }
  if (input.type !== "topic" && input.parentId === null) {
    return { field: "parentId", message: "Parent is required." };
  }
  if (input.assigneeId !== null) {
    const assignee = database.sqlite.prepare("SELECT id FROM users WHERE id = ?").get(input.assigneeId);
    if (!assignee) {
      return { field: "assigneeId", message: "Choose a valid Assignee." };
    }
  }
  if (input.labelIds.length > 0) {
    const validIds = new Set(database.db.select({ id: labels.id }).from(labels).all().map((label) => label.id));
    if (input.labelIds.some((id) => !validIds.has(id))) {
      return { field: "labelIds", message: "Choose valid Labels." };
    }
  }
  return null;
}

function applyStatusChanges(database: DatabaseClient, changes: { id: number; status: WorkItemStatus }[], actorId: number, now: number) {
  if (changes.length === 0) {
    return;
  }
  const update = database.sqlite.prepare("UPDATE work_items SET status = ?, updatedAt = ?, updatedBy = ? WHERE id = ?");
  for (const change of changes) {
    update.run(change.status, now, actorId, change.id);
  }
}

function escapeLike(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function isWholeDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
