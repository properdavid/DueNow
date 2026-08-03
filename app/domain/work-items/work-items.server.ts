import { eq } from "drizzle-orm";

import type { DatabaseClient } from "~/db/client";
import { comments, labels, users, workItems, workItemStatuses, workItemTypes, type WorkItemStatus, type WorkItemType } from "~/db/schema";
import {
  ancestorsForWorkItem,
  unfinishedDescendantsForSettleConfirmation,
  parentTypeForWorkItemType,
  planCreateStatusEffects,
  planReparent,
  planReopenTerminalAncestors,
  planStartCascade,
  planSettleCascade,
  planUnsettle,
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
  children: WorkItemDetailChild[];
  comments: WorkItemCommentReadModel[];
  labels: { id: number; name: string }[];
  unfinishedDescendants: { id: number; summary: string; type: WorkItemType }[];
  reopenNotice: TerminalAncestorNotice[];
  startCascadeAncestors: { id: number; summary: string }[];
}

export interface WorkItemCommentReadModel {
  id: number;
  body: string;
  createdAt: number;
  edited: boolean;
  author: WorkItemsTreeMember;
}

export interface WorkItemDetailChild extends WorkItemsTreeRow {
  unfinishedDescendants: { id: number; summary: string; type: WorkItemType }[];
  reopenNotice: TerminalAncestorNotice[];
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

export type UpdateWorkItemStatusResult =
  | { ok: true; changed: number }
  | { ok: false; error: { field?: string; message: string } };

export type ReparentWorkItemResult = { ok: true; changed: number } | { ok: false; error: { field?: string; message: string } };

export type CommentMutationResult = { ok: true } | { ok: false; error: { field?: string; message: string } };

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
  const selectedComments = loadCommentsForWorkItem(database, id);

  return {
    item,
    breadcrumb: [...ancestorsForWorkItem(rows, id).map(({ id, summary: label, type }) => ({ id, label, type })), { id: item.id, label: typeLabel(item.type), type: item.type }],
    children: rows
      .filter((row) => row.parentId === id)
      .map((child) => ({
        ...child,
        unfinishedDescendants: unfinishedDescendantsForSettleConfirmation(rows, child.id).map(({ id, summary, type }) => ({ id, summary, type })),
        reopenNotice: planUnsettle(rows, child.id, "open").reopenNotice,
      })),
    comments: selectedComments,
    labels: selectedLabels,
    unfinishedDescendants: unfinishedDescendantsForSettleConfirmation(rows, id).map(({ id, summary, type }) => ({ id, summary, type })),
    reopenNotice: planUnsettle(rows, id, "open").reopenNotice,
    startCascadeAncestors:
      item.status === "open"
        ? planStartCascade(rows, id)
            .filter((change) => change.id !== id)
            .map((change) => rows.find((row) => row.id === change.id))
            .filter((row): row is WorkItemsTreeRow => Boolean(row))
            .map(({ id, summary }) => ({ id, summary }))
        : [],
  };
}

export function addCommentToWorkItem(database: DatabaseClient, workItemId: number, body: string, actorId: number, now = Date.now()): CommentMutationResult {
  ensureWorkItemExists(database, workItemId);
  const validation = validateCommentBody(body);
  if (validation) {
    return { ok: false, error: validation };
  }

  database.sqlite.transaction(() => {
    database.sqlite.prepare("INSERT INTO comments (workItemId, authorId, body, createdAt, edited) VALUES (?, ?, ?, ?, 0)").run(workItemId, actorId, body.trim(), now);
    touchWorkItem(database, workItemId, actorId, now);
  })();
  return { ok: true };
}

export function editComment(database: DatabaseClient, commentId: number, body: string, actorId: number, now = Date.now()): CommentMutationResult {
  const comment = loadCommentOwner(database, commentId);
  ensureCommentAuthor(comment, actorId);
  const validation = validateCommentBody(body);
  if (validation) {
    return { ok: false, error: validation };
  }

  database.sqlite.transaction(() => {
    database.sqlite.prepare("UPDATE comments SET body = ?, edited = 1 WHERE id = ?").run(body.trim(), commentId);
    touchWorkItem(database, comment.workItemId, actorId, now);
  })();
  return { ok: true };
}

export function deleteComment(database: DatabaseClient, commentId: number, actorId: number, now = Date.now()): CommentMutationResult {
  const comment = loadCommentOwner(database, commentId);
  ensureCommentAuthor(comment, actorId);
  database.sqlite.transaction(() => {
    database.sqlite.prepare("DELETE FROM comments WHERE id = ?").run(commentId);
    touchWorkItem(database, comment.workItemId, actorId, now);
  })();
  return { ok: true };
}

export function loadParentCandidates(database: DatabaseClient, type: WorkItemType, query: string, excludeParentId: number | null = null): ParentCandidate[] {
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
    .filter((row) => row.id !== excludeParentId)
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

export function reparentWorkItem(
  database: DatabaseClient,
  id: number,
  newParentId: number,
  confirmed: boolean,
  actorId: number,
  now = Date.now(),
): ReparentWorkItemResult {
  return database.sqlite.transaction(() => {
    const rows = loadTreeRows(database);
    const target = rows.find((row) => row.id === id);
    if (!target) {
      throw new Response("Work Item not found", { status: 404 });
    }
    if (target.type === "topic") {
      return { ok: false as const, error: { field: "id", message: "A Topic cannot be reparented." } };
    }
    if (target.parentId === newParentId) {
      return { ok: false as const, error: { field: "parentId", message: "Choose a different Parent." } };
    }
    const newParent = rows.find((row) => row.id === newParentId);
    if (!newParent) {
      return { ok: false as const, error: { field: "parentId", message: "Choose a valid Parent." } };
    }

    let plan;
    try {
      plan = planReparent(rows, id, newParentId);
    } catch {
      return { ok: false as const, error: { field: "parentId", message: "Choose a valid Parent." } };
    }
    if (plan.reopenStatusChanges.length > 0 && !confirmed) {
      return { ok: false as const, error: { field: "confirmed", message: "Confirm the Reopen Notice first." } };
    }

    database.sqlite
      .prepare("UPDATE work_items SET parentId = ?, parentType = ?, updatedAt = ?, updatedBy = ? WHERE id = ?")
      .run(plan.parentage.parentId, plan.parentage.parentType, now, actorId, plan.parentage.id);
    const statusChanges = [...plan.statusChanges, ...plan.reopenStatusChanges];
    applyStatusChanges(database, statusChanges, actorId, now);
    return { ok: true as const, changed: 1 + statusChanges.length };
  })();
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

    if (target.status === "in_progress") {
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

export function settleWorkItem(
  database: DatabaseClient,
  id: number,
  status: WorkItemStatus,
  confirmed: boolean,
  actorId: number,
  now = Date.now(),
): UpdateWorkItemStatusResult {
  return database.sqlite.transaction(() => {
    const rows = loadTreeRows(database);
    const target = rows.find((row) => row.id === id);
    if (!target) {
      throw new Response("Work Item not found", { status: 404 });
    }

    if (!isTerminalStatus(status)) {
      return { ok: false as const, error: { field: "status", message: "Choose Completed or Closed to settle." } };
    }

    const unfinishedDescendants = unfinishedDescendantsForSettleConfirmation(rows, id);
    if (unfinishedDescendants.length > 0 && !confirmed) {
      return { ok: false as const, error: { field: "confirmed", message: "Confirm the Settle Cascade first." } };
    }
    const changes = planSettleCascade(rows, id, status);
    applyStatusChanges(database, changes, actorId, now);
    return { ok: true as const, changed: changes.length };
  })();
}

export function unsettleWorkItem(database: DatabaseClient, id: number, actorId: number, now = Date.now()): UpdateWorkItemStatusResult {
  return database.sqlite.transaction(() => {
    const rows = loadTreeRows(database);
    const target = rows.find((row) => row.id === id);
    if (!target) {
      throw new Response("Work Item not found", { status: 404 });
    }
    if (target.status === "open") {
      return { ok: true as const, changed: 0 };
    }
    const plan = planUnsettle(rows, id, "open");
    if (plan.reopenNotice.length > 0) {
      return { ok: false as const, error: { field: "confirmed", message: "Confirm the Reopen Notice first." } };
    }
    const changes = plan.statusChanges;
    applyStatusChanges(database, changes, actorId, now);
    return { ok: true as const, changed: changes.length };
  })();
}

export function reopenAndUnsettleWorkItem(database: DatabaseClient, id: number, actorId: number, now = Date.now()): UpdateWorkItemStatusResult {
  return database.sqlite.transaction(() => {
    const rows = loadTreeRows(database);
    const target = rows.find((row) => row.id === id);
    if (!target) {
      throw new Response("Work Item not found", { status: 404 });
    }
    if (target.status === "open") {
      return { ok: true as const, changed: 0 };
    }
    const plan = planUnsettle(rows, id, "open");
    const changes = [...plan.statusChanges, ...planReopenTerminalAncestors(plan.reopenNotice)];
    applyStatusChanges(database, changes, actorId, now);
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

export function attachLabelToWorkItem(database: DatabaseClient, id: number, labelId: number, actorId: number, now = Date.now()): UpdateWorkItemResult {
  ensureWorkItemExists(database, id);
  if (!labelExists(database, labelId)) {
    return { ok: false, error: { field: "labelId", message: "Choose a valid Label." } };
  }
  database.sqlite.transaction(() => {
    database.sqlite.prepare("INSERT OR IGNORE INTO work_item_labels (workItemId, labelId) VALUES (?, ?)").run(id, labelId);
    touchWorkItem(database, id, actorId, now);
  })();
  return { ok: true };
}

export function detachLabelFromWorkItem(database: DatabaseClient, id: number, labelId: number, actorId: number, now = Date.now()): UpdateWorkItemResult {
  ensureWorkItemExists(database, id);
  if (!labelExists(database, labelId)) {
    return { ok: false, error: { field: "labelId", message: "Choose a valid Label." } };
  }
  database.sqlite.transaction(() => {
    database.sqlite.prepare("DELETE FROM work_item_labels WHERE workItemId = ? AND labelId = ?").run(id, labelId);
    touchWorkItem(database, id, actorId, now);
  })();
  return { ok: true };
}

export function createAndAttachLabelToWorkItem(database: DatabaseClient, id: number, name: string, actorId: number, now = Date.now()): UpdateWorkItemResult {
  ensureWorkItemExists(database, id);
  const trimmed = name.trim();
  const validationError = validateLabelName(database, trimmed);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  return database.sqlite.transaction(() => {
    const existing = labelWithName(database, trimmed);
    if (existing) {
      return { ok: false as const, error: { field: "name", message: "A Label with that name already exists." } };
    }
    const label = database.sqlite
      .prepare("INSERT INTO labels (name, createdAt, updatedAt) VALUES (?, ?, ?) RETURNING id")
      .get(trimmed, now, now) as { id: number };
    database.sqlite.prepare("INSERT INTO work_item_labels (workItemId, labelId) VALUES (?, ?)").run(id, label.id);
    touchWorkItem(database, id, actorId, now);
    return { ok: true as const };
  })();
}

function ensureWorkItemExists(database: DatabaseClient, id: number) {
  const row = database.sqlite.prepare("SELECT id FROM work_items WHERE id = ?").get(id);
  if (!row) {
    throw new Response("Work Item not found", { status: 404 });
  }
}

function loadCommentsForWorkItem(database: DatabaseClient, workItemId: number): WorkItemCommentReadModel[] {
  return database.db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      edited: comments.edited,
      authorId: users.id,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.workItemId, workItemId))
    .orderBy(comments.createdAt, comments.id)
    .all()
    .map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      edited: comment.edited,
      author: { id: comment.authorId, name: comment.authorName, email: comment.authorEmail },
    }));
}

function loadCommentOwner(database: DatabaseClient, commentId: number) {
  const comment = database.sqlite.prepare("SELECT id, workItemId, authorId FROM comments WHERE id = ?").get(commentId) as
    | { id: number; workItemId: number; authorId: number }
    | undefined;
  if (!comment) {
    throw new Response("Comment not found", { status: 404 });
  }
  return comment;
}

function ensureCommentAuthor(comment: { authorId: number }, actorId: number) {
  if (comment.authorId !== actorId) {
    throw new Response("You can only change your own Comment.", { status: 403 });
  }
}

function validateCommentBody(body: string): { field?: string; message: string } | null {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    return { field: "body", message: "Comment is required." };
  }
  if (trimmed.length > 20_000) {
    return { field: "body", message: `Comment is too long (${trimmed.length.toLocaleString("en-US")} characters, limit 20,000).` };
  }
  return null;
}

function labelExists(database: DatabaseClient, id: number) {
  return Boolean(database.sqlite.prepare("SELECT id FROM labels WHERE id = ?").get(id));
}

function labelWithName(database: DatabaseClient, name: string) {
  return database.sqlite.prepare("SELECT id FROM labels WHERE lower(name) = lower(?)").get(name);
}

function validateLabelName(database: DatabaseClient, name: string): { field?: string; message: string } | null {
  if (name.length === 0) {
    return { field: "name", message: "Label name is required." };
  }
  if (name.length > 30) {
    return { field: "name", message: "Label name must be 30 characters or fewer." };
  }
  if (labelWithName(database, name)) {
    return { field: "name", message: "A Label with that name already exists." };
  }
  return null;
}

function touchWorkItem(database: DatabaseClient, id: number, actorId: number, now: number) {
  database.sqlite.prepare("UPDATE work_items SET updatedAt = ?, updatedBy = ? WHERE id = ?").run(now, actorId, id);
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

function isTerminalStatus(status: WorkItemStatus) {
  return status === "completed" || status === "closed";
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
  const statusCases = changes.map(() => "WHEN ? THEN ?").join(" ");
  const ids = changes.map(() => "?").join(", ");
  const statusParams = changes.flatMap((change) => [change.id, change.status]);
  const idParams = changes.map((change) => change.id);
  database.sqlite
    .prepare(`UPDATE work_items SET status = CASE id ${statusCases} END, updatedAt = ?, updatedBy = ? WHERE id IN (${ids})`)
    .run(...statusParams, now, actorId, ...idParams);
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
