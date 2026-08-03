export const workItemTypes = ["topic", "project", "task", "subtask"] as const;
export const workItemStatuses = ["open", "in_progress", "completed", "closed"] as const;
export const terminalStatuses = ["completed", "closed"] as const;
export const unfinishedStatuses = ["open", "in_progress"] as const;

export type WorkItemType = (typeof workItemTypes)[number];
export type WorkItemStatus = (typeof workItemStatuses)[number];
export type TerminalStatus = (typeof terminalStatuses)[number];
export type UnfinishedStatus = (typeof unfinishedStatuses)[number];

export interface TreeWorkItem {
  id: number;
  type: WorkItemType;
  parentId: number | null;
  status: WorkItemStatus;
  dueDate: string | null;
  summary: string;
}

export interface StatusChange {
  id: number;
  status: WorkItemStatus;
}

export interface ParentageChange {
  id: number;
  parentId: number | null;
  parentType: WorkItemType | null;
}

export interface ReparentPlan {
  parentage: ParentageChange;
  statusChanges: StatusChange[];
  reopenStatusChanges: StatusChange[];
}

export interface ReopenableStatusPlan {
  statusChanges: StatusChange[];
  reopenStatusChanges: StatusChange[];
}

export interface UnsettlePlan {
  statusChanges: StatusChange[];
  reopenNotice: TerminalAncestorNotice[];
}

export interface TerminalAncestorNotice {
  id: number;
  summary: string;
  status: TerminalStatus;
}

export interface TerminalSubtreeViolation {
  terminalId: number;
  unfinishedDescendantId: number;
}

export interface DueTabOptions {
  visibleIds?: ReadonlySet<number>;
}

export interface DueTabGroups {
  now: TreeWorkItem[];
  soon: TreeWorkItem[];
  later: TreeWorkItem[];
}

const parentTypeByType = {
  topic: null,
  project: "topic",
  task: "project",
  subtask: "task",
} as const satisfies Record<WorkItemType, WorkItemType | null>;

function byId(rows: readonly TreeWorkItem[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

function requireRow(rows: readonly TreeWorkItem[], id: number) {
  const row = byId(rows).get(id);
  if (!row) {
    throw new Error(`Unknown Work Item id ${id}`);
  }
  return row;
}

function isTerminal(status: WorkItemStatus): status is TerminalStatus {
  return status === "completed" || status === "closed";
}

function isUnfinished(status: WorkItemStatus): status is UnfinishedStatus {
  return status === "open" || status === "in_progress";
}

export function ancestorsForWorkItem(rows: readonly TreeWorkItem[], id: number): TreeWorkItem[] {
  return getAncestors(rows, id);
}

export function unfinishedDescendantsForSettleConfirmation(
  rows: readonly TreeWorkItem[],
  id: number,
): TreeWorkItem[] {
  return getDescendants(rows, id).filter((descendant) => isUnfinished(descendant.status));
}

function getAncestors(rows: readonly TreeWorkItem[], id: number): TreeWorkItem[] {
  const index = byId(rows);
  const ancestors: TreeWorkItem[] = [];
  let current = requireRow(rows, id);

  while (current.parentId !== null) {
    const parent = index.get(current.parentId);
    if (!parent) {
      throw new Error(`Work Item ${current.id} references missing parent ${current.parentId}`);
    }
    ancestors.unshift(parent);
    current = parent;
  }

  return ancestors;
}

function getDescendants(rows: readonly TreeWorkItem[], id: number): TreeWorkItem[] {
  requireRow(rows, id);
  const childrenByParent = new Map<number, TreeWorkItem[]>();
  for (const row of rows) {
    if (row.parentId === null) {
      continue;
    }
    const siblings = childrenByParent.get(row.parentId) ?? [];
    siblings.push(row);
    childrenByParent.set(row.parentId, siblings);
  }

  const descendants: TreeWorkItem[] = [];
  const visit = (parentId: number) => {
    for (const child of childrenByParent.get(parentId) ?? []) {
      descendants.push(child);
      visit(child.id);
    }
  };
  visit(id);
  return descendants;
}

export function planSettleCascade(
  rows: readonly TreeWorkItem[],
  id: number,
  status: TerminalStatus,
): StatusChange[] {
  const target = requireRow(rows, id);
  const changes: StatusChange[] = target.status === status ? [] : [{ id: target.id, status }];

  for (const descendant of unfinishedDescendantsForSettleConfirmation(rows, id)) {
    changes.push({ id: descendant.id, status });
  }

  return changes;
}

export function planStartCascade(rows: readonly TreeWorkItem[], id: number): StatusChange[] {
  const target = requireRow(rows, id);
  const changes: StatusChange[] = target.status === "in_progress" ? [] : [{ id: target.id, status: "in_progress" }];
  return [...changes, ...planOpenAncestorChainToInProgress(rows, id)];
}

export function planCreateStatusEffects(
  rows: readonly TreeWorkItem[],
  parentId: number | null,
  status: WorkItemStatus,
): ReopenableStatusPlan {
  return {
    statusChanges:
      parentId !== null && status === "in_progress"
        ? planOpenAncestorChainToInProgress(rows, parentId, { includeStart: true })
        : [],
    reopenStatusChanges: planReopenTerminalAncestors(creationWouldNeedReopen(rows, parentId, status)),
  };
}

export function planReparent(rows: readonly TreeWorkItem[], id: number, newParentId: number): ReparentPlan {
  const item = requireRow(rows, id);
  const newParent = requireRow(rows, newParentId);
  const expectedParentType = parentTypeByType[item.type];
  if (newParent.type !== expectedParentType) {
    throw new Error(`${newParent.type} cannot parent ${item.type}`);
  }

  return {
    parentage: {
      id: item.id,
      parentId: newParent.id,
      parentType: newParent.type,
    },
    statusChanges:
      item.status === "in_progress"
        ? planOpenAncestorChainToInProgress(rows, newParent.id, { includeStart: true })
        : [],
    reopenStatusChanges: planReopenTerminalAncestors(reparentWouldNeedReopen(rows, item.id, newParent.id)),
  };
}

function planOpenAncestorChainToInProgress(
  rows: readonly TreeWorkItem[],
  id: number,
  options: { includeStart?: boolean } = {},
): StatusChange[] {
  const start = requireRow(rows, id);
  const changes: StatusChange[] = [];
  const chain = options.includeStart ? [start, ...getAncestors(rows, start.id).reverse()] : getAncestors(rows, start.id).reverse();

  for (const row of chain) {
    if (row.status === "in_progress") {
      break;
    }
    if (row.status === "open") {
      changes.push({ id: row.id, status: "in_progress" });
    }
  }

  return changes;
}

export function planUnsettle(rows: readonly TreeWorkItem[], id: number, status: UnfinishedStatus): UnsettlePlan {
  requireRow(rows, id);
  return {
    statusChanges: [{ id, status }],
    reopenNotice: unsettledStatusWouldNeedReopen(rows, id, status),
  };
}

function toTerminalAncestorNotices(rows: readonly TreeWorkItem[]): TerminalAncestorNotice[] {
  return rows
    .filter((row): row is TreeWorkItem & { status: TerminalStatus } => isTerminal(row.status))
    .map(({ id, summary, status }) => ({ id, summary, status }));
}

export function creationWouldNeedReopen(
  rows: readonly TreeWorkItem[],
  parentId: number | null,
  status: WorkItemStatus,
): TerminalAncestorNotice[] {
  if (parentId === null || !isUnfinished(status)) {
    return [];
  }
  const parent = requireRow(rows, parentId);
  const ancestorsAndParent = [...getAncestors(rows, parent.id), parent];
  return toTerminalAncestorNotices(ancestorsAndParent);
}

export function reparentWouldNeedReopen(
  rows: readonly TreeWorkItem[],
  id: number,
  newParentId: number | null,
): TerminalAncestorNotice[] {
  const item = requireRow(rows, id);
  return creationWouldNeedReopen(rows, newParentId, item.status);
}

export function unsettledStatusWouldNeedReopen(
  rows: readonly TreeWorkItem[],
  id: number,
  status: WorkItemStatus,
): TerminalAncestorNotice[] {
  requireRow(rows, id);
  if (!isUnfinished(status)) {
    return [];
  }
  return toTerminalAncestorNotices(getAncestors(rows, id));
}

export function planReopenTerminalAncestors(notice: readonly TerminalAncestorNotice[]): StatusChange[] {
  return notice.map(({ id }) => ({ id, status: "in_progress" }));
}

export function validateTerminalSubtree(rows: readonly TreeWorkItem[]): TerminalSubtreeViolation[] {
  const violations: TerminalSubtreeViolation[] = [];

  for (const row of rows) {
    if (!isTerminal(row.status)) {
      continue;
    }
    for (const descendant of getDescendants(rows, row.id)) {
      if (isUnfinished(descendant.status)) {
        violations.push({ terminalId: row.id, unfinishedDescendantId: descendant.id });
      }
    }
  }

  return violations;
}

export function validParentsForCreation(rows: readonly TreeWorkItem[], type: WorkItemType): TreeWorkItem[] {
  const parentType = parentTypeByType[type];
  if (parentType === null) {
    return [];
  }
  return rows.filter((row) => row.type === parentType);
}

export function validParentsForReparent(rows: readonly TreeWorkItem[], id: number): TreeWorkItem[] {
  const item = requireRow(rows, id);
  return validParentsForCreation(rows, item.type).filter((candidate) => candidate.id !== item.parentId);
}

export function dueTabGroups(rows: readonly TreeWorkItem[], today: string, options: DueTabOptions = {}): DueTabGroups {
  const visibleRows = options.visibleIds ? rows.filter((row) => options.visibleIds?.has(row.id)) : [...rows];
  const horizon = addDays(today, 30);
  const candidates = visibleRows.filter(isDueCandidate(horizon));
  const visibleCandidateIds = new Set(candidates.map((row) => row.id));
  const uncovered = candidates.filter((row) => !isCoveredByVisibleDescendant(rows, row, visibleCandidateIds));
  uncovered.sort(compareDueRows);

  return {
    now: uncovered.filter((row) => row.dueDate !== null && row.dueDate <= today),
    soon: uncovered.filter((row) => row.dueDate !== null && row.dueDate > today && row.dueDate <= addDays(today, 7)),
    later: uncovered.filter((row) => row.dueDate !== null && row.dueDate > addDays(today, 7)),
  };
}

function isDueCandidate(horizon: string) {
  return (row: TreeWorkItem): row is TreeWorkItem & { dueDate: string } =>
    isUnfinished(row.status) && row.dueDate !== null && row.dueDate <= horizon;
}

function isCoveredByVisibleDescendant(
  rows: readonly TreeWorkItem[],
  row: TreeWorkItem,
  visibleCandidateIds: ReadonlySet<number>,
) {
  if (row.dueDate === null) {
    return false;
  }
  const dueDate = row.dueDate;
  return getDescendants(rows, row.id).some(
    (descendant) => visibleCandidateIds.has(descendant.id) && descendant.dueDate !== null && descendant.dueDate <= dueDate,
  );
}

function compareDueRows(left: TreeWorkItem, right: TreeWorkItem) {
  const leftDate = left.dueDate ?? "9999-12-31";
  const rightDate = right.dueDate ?? "9999-12-31";
  if (leftDate !== rightDate) {
    return leftDate.localeCompare(rightDate);
  }
  return left.id - right.id;
}

export function formatLateness(dueDate: string, today: string): string {
  const days = daysBetween(dueDate, today);
  if (days <= 0) {
    return "not late";
  }
  if (days <= 14) {
    return `${days} ${plural(days, "day")} late`;
  }
  if (days < 56) {
    const weeks = Math.max(2, Math.round(days / 7));
    return `${weeks} ${plural(weeks, "week")} late`;
  }
  const months = Math.max(2, Math.round(days / 30));
  return `${months} ${plural(months, "month")} late`;
}

function plural(count: number, unit: string) {
  return count === 1 ? unit : `${unit}s`;
}

function addDays(date: string, days: number): string {
  const value = parseDate(date);
  value.setUTCDate(value.getUTCDate() + days);
  return formatDate(value);
}

function daysBetween(start: string, end: string): number {
  return Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / 86_400_000);
}

function parseDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
