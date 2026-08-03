import { renderToStaticMarkup } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { describe, expect, test } from "vitest";

import { createRouteTestHarness } from "~/test/route-harness";
import { loadWorkItemsTree } from "~/domain/work-items/work-items.server";
import * as startRoute from "./api.work-items.$id.start";
import { WorkItemsTree } from "./items";
import type { WorkItemsTreeReadModel, WorkItemsTreeRow } from "~/domain/work-items/work-items.server";

function row(overrides: Partial<WorkItemsTreeRow> & Pick<WorkItemsTreeRow, "id" | "type" | "parentId" | "summary">): WorkItemsTreeRow {
  return {
    status: "open",
    dueDate: null,
    description: "",
    assigneeId: null,
    assignee: null,
    ...overrides,
  };
}

function renderTree(model: WorkItemsTreeReadModel & { user: { id: number; email: string; name: string; theme: "system" } }, path = "/items") {
  const Stub = createRoutesStub([{ path: "/items/*", Component: () => <WorkItemsTree loaderData={model} /> }]);
  return renderToStaticMarkup(<Stub initialEntries={[path]} />);
}

describe("Work Items tree route seam", () => {
  test("the read model orders siblings by id and expands exactly a selected Work Item's ancestors", () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const now = 1;
      const user = harness.database.sqlite
        .prepare("INSERT INTO users (googleSubject, email, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?) RETURNING id")
        .get("dana", "dana@example.com", "Dana", now, now) as { id: number };
      harness.database.sqlite
        .prepare("INSERT INTO work_items (id, type, parentId, parentType, summary, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(7, "topic", null, null, "Travel", "open", now, now, user.id, user.id);
      harness.database.sqlite
        .prepare("INSERT INTO work_items (id, type, parentId, parentType, summary, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(3, "topic", null, null, "House", "open", now, now, user.id, user.id);
      harness.database.sqlite
        .prepare("INSERT INTO work_items (id, type, parentId, parentType, summary, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(8, "project", 7, "topic", "San Diego", "open", now, now, user.id, user.id);
      harness.database.sqlite
        .prepare("INSERT INTO work_items (id, type, parentId, parentType, summary, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(9, "task", 8, "project", "Book lodging", "open", now, now, user.id, user.id);

      const model = loadWorkItemsTree(harness.database, 9);

      expect(model.rows.map((item) => item.id)).toEqual([3, 7, 8, 9]);
      expect(model.ancestorIds).toEqual([7, 8]);
      expect(model.selectedId).toBe(9);
    } finally {
      harness.close();
    }
  });

  test("Start from the row menu fires the Start Cascade", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const user = harness.database.sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };
      const insert = harness.database.sqlite.prepare(
        "INSERT INTO work_items (id, type, parentId, parentType, summary, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      );
      insert.run(1, "topic", null, null, "House", "open", 1, 1, user.id, user.id);
      insert.run(2, "project", 1, "topic", "Kitchen", "open", 1, 1, user.id, user.id);
      insert.run(3, "task", 2, "project", "Paint cabinets", "open", 1, 1, user.id, user.id);

      const response = await startRoute.action({
        request: harness.request("/api/work-items/3/start?returnTo=/items/3", { method: "POST", headers: { Cookie: cookie } }),
        params: { id: "3" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof startRoute.action>[0]);

      const statuses = harness.database.sqlite.prepare("SELECT id, status FROM work_items ORDER BY id").all();
      expect(response).toBeInstanceOf(Response);
      expect((response as Response).headers.get("Location")).toBe("/items/3");
      expect(statuses).toEqual([
        { id: 1, status: "in_progress" },
        { id: 2, status: "in_progress" },
        { id: 3, status: "in_progress" },
      ]);
    } finally {
      harness.close();
    }
  });
});

describe("Work Items tree rendering seam", () => {
  const user = { id: 1, email: "dana@example.com", name: "Dana", theme: "system" as const };

  test("/items opens fully collapsed with only Topics visible and required row controls present", () => {
    const markup = renderTree({
      user,
      hasAnyWorkItems: true,
      selectedId: null,
      ancestorIds: [],
      rows: [
        row({ id: 1, type: "topic", parentId: null, summary: "Travel", assigneeId: 1, assignee: user }),
        row({ id: 2, type: "project", parentId: 1, summary: "San Diego" }),
        row({ id: 3, type: "task", parentId: 2, summary: "Book lodging", status: "completed", dueDate: "2026-08-02" }),
      ],
    });

    expect(markup).toContain("Travel");
    expect(markup).not.toContain("San Diego");
    expect(markup).toContain("Collapse all");
    expect(markup).toContain("Expand all");
    expect(markup).toContain("Open row menu for Travel");
    expect(markup).not.toContain("Complete");
    expect(markup).not.toContain("Close");
    expect(markup).toContain("1 settled");
    expect(markup).toContain("aria-label=\"Open Status Mark\"");
    expect(markup).toContain("aria-label=\"topic Type Mark\"");
  });

  test("/items/:id expands the selected Work Item's ancestor chain and renders unassigned as an avatar", () => {
    const markup = renderTree(
      {
        user,
        hasAnyWorkItems: true,
        selectedId: 3,
        ancestorIds: [1, 2],
        rows: [
          row({ id: 1, type: "topic", parentId: null, summary: "Travel" }),
          row({ id: 2, type: "project", parentId: 1, summary: "San Diego" }),
          row({ id: 3, type: "task", parentId: 2, summary: "Book lodging" }),
          row({ id: 4, type: "subtask", parentId: 3, summary: "Research Airbnbs" }),
        ],
      },
      "/items/3",
    );

    expect(markup).toContain("Travel");
    expect(markup).toContain("San Diego");
    expect(markup).toContain("Book lodging");
    expect(markup).not.toContain("Research Airbnbs");
    expect(markup).toContain("aria-label=\"Unassigned\"");
  });

  test("empty First Run and all-settled surfaces are cards with no create button", () => {
    const firstRun = renderTree({ user, hasAnyWorkItems: false, selectedId: null, ancestorIds: [], rows: [] });
    const allSettled = renderTree({
      user,
      hasAnyWorkItems: true,
      selectedId: null,
      ancestorIds: [],
      rows: [row({ id: 1, type: "topic", parentId: null, summary: "House", status: "closed" })],
    });

    expect(firstRun).toContain("Nothing here yet");
    expect(firstRun).toContain("Start with a Topic");
    expect(firstRun).not.toContain("New work item");
    expect(allSettled).toContain("All settled");
    expect(allSettled).toContain("Nothing is unfinished");
    expect(allSettled).toContain("Show 1 settled");
    expect(allSettled).not.toContain("New work item");
  });
});
