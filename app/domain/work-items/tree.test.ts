import { describe, expect, test } from "vitest";

import {
  creationWouldNeedReopen,
  dueTabGroups,
  formatLateness,
  ancestorsForWorkItem,
  planSettleCascade,
  planCreateStatusEffects,
  planReparent,
  planStartCascade,
  planReopenTerminalAncestors,
  planUnsettle,
  reparentWouldNeedReopen,
  unsettledStatusWouldNeedReopen,
  unfinishedDescendantsForSettleConfirmation,
  validParentsForCreation,
  validParentsForReparent,
  validateTerminalSubtree,
  type TerminalAncestorNotice,
  type TreeWorkItem,
} from "./tree";

const baseRows: TreeWorkItem[] = [
  { id: 1, type: "topic", parentId: null, status: "open", dueDate: null, summary: "House" },
  { id: 2, type: "project", parentId: 1, status: "open", dueDate: null, summary: "Kitchen" },
  { id: 3, type: "task", parentId: 2, status: "open", dueDate: null, summary: "Paint cabinets" },
  { id: 4, type: "subtask", parentId: 3, status: "open", dueDate: null, summary: "Buy primer" },
  { id: 5, type: "task", parentId: 2, status: "completed", dueDate: null, summary: "Choose colour" },
];

describe("Work Item tree semantics", () => {
  test("a Kitchen task knows its breadcrumb ancestors", () => {
    expect(ancestorsForWorkItem(baseRows, 3).map((row) => row.summary)).toEqual(["House", "Kitchen"]);
  });

  test("settling the Kitchen sweeps unfinished descendants and leaves already terminal work alone", () => {
    expect(unfinishedDescendantsForSettleConfirmation(baseRows, 2).map((row) => row.summary)).toEqual([
      "Paint cabinets",
      "Buy primer",
    ]);
    expect(planSettleCascade(baseRows, 2, "closed")).toEqual([
      { id: 2, status: "closed" },
      { id: 3, status: "closed" },
      { id: 4, status: "closed" },
    ]);
  });

  test("starting primer walks up Open ancestors and stops at the already In Progress house", () => {
    const rows = baseRows.map((row) => (row.id === 1 ? { ...row, status: "in_progress" as const } : row));

    expect(planStartCascade(rows, 4)).toEqual([
      { id: 4, status: "in_progress" },
      { id: 3, status: "in_progress" },
      { id: 2, status: "in_progress" },
    ]);
  });

  test("creating an In Progress painter task starts the Open destination ancestors", () => {
    const rows: TreeWorkItem[] = [
      { id: 1, type: "topic", parentId: null, status: "open", dueDate: null, summary: "House" },
      { id: 2, type: "project", parentId: 1, status: "open", dueDate: null, summary: "Kitchen" },
    ];

    expect(planCreateStatusEffects(rows, 2, "in_progress")).toEqual({
      statusChanges: [
        { id: 2, status: "in_progress" },
        { id: 1, status: "in_progress" },
      ],
      reopenStatusChanges: [],
    });
    expect(planCreateStatusEffects(rows, 2, "open")).toEqual({ statusChanges: [], reopenStatusChanges: [] });
  });

  test("reparenting an In Progress cabinet task changes one parent row and starts the Open destination", () => {
    const rows: TreeWorkItem[] = [
      { id: 1, type: "topic", parentId: null, status: "in_progress", dueDate: null, summary: "House" },
      { id: 2, type: "project", parentId: 1, status: "in_progress", dueDate: null, summary: "Kitchen" },
      { id: 3, type: "project", parentId: 1, status: "open", dueDate: null, summary: "Patio" },
      { id: 4, type: "task", parentId: 2, status: "in_progress", dueDate: null, summary: "Paint cabinets" },
      { id: 5, type: "subtask", parentId: 4, status: "open", dueDate: null, summary: "Buy primer" },
    ];

    expect(planReparent(rows, 4, 3)).toEqual({
      parentage: { id: 4, parentId: 3, parentType: "project" },
      statusChanges: [{ id: 3, status: "in_progress" }],
      reopenStatusChanges: [],
    });
  });

  test("unsettling a completed colour choice touches only that Work Item", () => {
    expect(planUnsettle(baseRows, 5, "open")).toEqual({
      statusChanges: [{ id: 5, status: "open" }],
      reopenNotice: [],
    });
  });

  test("a Kitchen project stays In Progress when its last In Progress task returns to Open", () => {
    const rows: TreeWorkItem[] = [
      { id: 1, type: "topic", parentId: null, status: "in_progress", dueDate: null, summary: "House" },
      { id: 2, type: "project", parentId: 1, status: "in_progress", dueDate: null, summary: "Kitchen" },
      { id: 3, type: "task", parentId: 2, status: "in_progress", dueDate: null, summary: "Paint cabinets" },
    ];

    expect(planUnsettle(rows, 3, "open")).toEqual({
      statusChanges: [{ id: 3, status: "open" }],
      reopenNotice: [],
    });
    expect(rows.find((row) => row.id === 2)?.status).toBe("in_progress");
  });

  test("terminal ancestors are named the same before creating, reparenting, or reopening below them", () => {
    const rows: TreeWorkItem[] = [
      { id: 1, type: "topic", parentId: null, status: "completed", dueDate: null, summary: "House" },
      { id: 2, type: "project", parentId: 1, status: "closed", dueDate: null, summary: "Kitchen" },
      { id: 3, type: "task", parentId: 2, status: "completed", dueDate: null, summary: "Paint cabinets" },
      { id: 4, type: "subtask", parentId: 3, status: "closed", dueDate: null, summary: "Buy primer" },
      { id: 5, type: "task", parentId: 2, status: "open", dueDate: null, summary: "Book painter" },
    ];

    const expected = [
      { id: 1, summary: "House", status: "completed" },
      { id: 2, summary: "Kitchen", status: "closed" },
    ] satisfies TerminalAncestorNotice[];
    expect(creationWouldNeedReopen(rows, 2, "open")).toEqual(expected);
    expect(creationWouldNeedReopen(rows, 2, "completed")).toEqual([]);
    expect(reparentWouldNeedReopen(rows, 5, 2)).toEqual(expected);
    expect(reparentWouldNeedReopen(rows, 3, 2)).toEqual([]);
    expect(unsettledStatusWouldNeedReopen(rows, 3, "open")).toEqual(expected);
    expect(unsettledStatusWouldNeedReopen(rows, 3, "closed")).toEqual([]);
    expect(planUnsettle(rows, 3, "open")).toEqual({
      statusChanges: [{ id: 3, status: "open" }],
      reopenNotice: expected,
    });
    expect(planReopenTerminalAncestors(expected)).toEqual([
      { id: 1, status: "in_progress" },
      { id: 2, status: "in_progress" },
    ]);
    expect(validateTerminalSubtree(rows)).toEqual([
      { terminalId: 1, unfinishedDescendantId: 5 },
      { terminalId: 2, unfinishedDescendantId: 5 },
    ]);
  });

  test("creation and reparenting offer only same-rung legal parents, including terminal candidates", () => {
    const rows: TreeWorkItem[] = [
      { id: 1, type: "topic", parentId: null, status: "completed", dueDate: null, summary: "House" },
      { id: 2, type: "topic", parentId: null, status: "open", dueDate: null, summary: "Travel" },
      { id: 3, type: "project", parentId: 1, status: "closed", dueDate: null, summary: "Kitchen" },
      { id: 4, type: "project", parentId: 2, status: "open", dueDate: null, summary: "San Diego" },
      { id: 5, type: "task", parentId: 3, status: "open", dueDate: null, summary: "Paint cabinets" },
    ];

    expect(validParentsForCreation(rows, "project").map((row) => row.summary)).toEqual(["House", "Travel"]);
    expect(validParentsForCreation(rows, "task").map((row) => row.summary)).toEqual(["Kitchen", "San Diego"]);
    expect(validParentsForCreation(rows, "topic")).toEqual([]);
    expect(validParentsForReparent(rows, 5).map((row) => row.summary)).toEqual(["San Diego"]);
  });
});

describe("Due radar", () => {
  test("San Diego dates show the deepest visible actionable Work Item in each group", () => {
    const rows: TreeWorkItem[] = [
      { id: 1, type: "topic", parentId: null, status: "open", dueDate: "2026-07-01", summary: "Travel" },
      { id: 2, type: "project", parentId: 1, status: "in_progress", dueDate: "2026-08-03", summary: "San Diego Trip" },
      { id: 3, type: "task", parentId: 2, status: "open", dueDate: "2026-08-03", summary: "Book lodging" },
      { id: 4, type: "subtask", parentId: 3, status: "open", dueDate: "2026-08-06", summary: "Research Airbnbs" },
      { id: 5, type: "task", parentId: 2, status: "open", dueDate: "2026-08-20", summary: "Pack bags" },
      { id: 6, type: "task", parentId: 2, status: "completed", dueDate: "2026-08-02", summary: "Buy tickets" },
      { id: 7, type: "topic", parentId: null, status: "open", dueDate: "2026-09-03", summary: "Taxes" },
      { id: 8, type: "topic", parentId: null, status: "open", dueDate: null, summary: "Garden" },
      { id: 9, type: "topic", parentId: null, status: "open", dueDate: "2026-08-03", summary: "A same-day tie" },
    ];

    expect(dueTabGroups(rows, "2026-08-03")).toEqual({
      now: [rows[0], rows[2], rows[8]],
      soon: [rows[3]],
      later: [rows[4]],
    });
  });

  test("a visible filter and covering cannot combine to hide the only shown date", () => {
    const rows: TreeWorkItem[] = [
      { id: 1, type: "topic", parentId: null, status: "open", dueDate: "2026-08-10", summary: "House" },
      { id: 2, type: "project", parentId: 1, status: "open", dueDate: "2026-08-08", summary: "Kitchen" },
    ];

    expect(dueTabGroups(rows, "2026-08-03", { visibleIds: new Set([1]) })).toEqual({ now: [], soon: [rows[0]], later: [] });
  });

  test("dated work items with undated or terminal descendants reappear", () => {
    const rows: TreeWorkItem[] = [
      { id: 1, type: "topic", parentId: null, status: "open", dueDate: "2026-08-10", summary: "House" },
      { id: 2, type: "project", parentId: 1, status: "open", dueDate: null, summary: "Kitchen" },
      { id: 3, type: "task", parentId: 2, status: "completed", dueDate: "2026-08-09", summary: "Choose paint" },
    ];

    expect(dueTabGroups(rows, "2026-08-03")).toEqual({ now: [], soon: [rows[0]], later: [] });
  });

  test("lateness keeps very old overdue Work Items in Due Now and rounds days, weeks, then months", () => {
    const rows: TreeWorkItem[] = [
      { id: 1, type: "topic", parentId: null, status: "open", dueDate: "2026-06-17", summary: "Old tax filing" },
    ];

    expect(dueTabGroups(rows, "2026-08-03").now).toEqual(rows);
    expect(formatLateness("2026-08-02", "2026-08-03")).toBe("1 day late");
    expect(formatLateness("2026-07-20", "2026-08-03")).toBe("14 days late");
    expect(formatLateness("2026-07-19", "2026-08-03")).toBe("2 weeks late");
    expect(formatLateness("2026-06-17", "2026-08-03")).toBe("7 weeks late");
    expect(formatLateness("2026-05-01", "2026-08-03")).toBe("3 months late");
  });
});
