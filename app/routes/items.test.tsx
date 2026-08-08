import { renderToStaticMarkup } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { describe, expect, test } from "vitest";

import { createRouteTestHarness } from "~/test/route-harness";
import { loadWorkItemsTree } from "~/domain/work-items/work-items.server";
import { CreationDialogProvider } from "~/components/shell/creation-dialog";
import * as createRoute from "./api.work-items.create";
import * as parentsRoute from "./api.parents";
import * as reparentRoute from "./api.work-items.$id.reparent";
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
  const Stub = createRoutesStub([
    {
      path: "/items/*",
      Component: () => (
        <CreationDialogProvider members={[model.user]} labels={[]}>
          <WorkItemsTree loaderData={model} />
        </CreationDialogProvider>
      ),
    },
  ]);
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

  test("/api/parents filters by legal parent rung and Summary LIKE while carrying lineage and terminal status", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const user = harness.database.sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };
      const insert = harness.database.sqlite.prepare(
        "INSERT INTO work_items (id, type, parentId, parentType, summary, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      );
      insert.run(1, "topic", null, null, "House", "completed", 1, 1, user.id, user.id);
      insert.run(2, "topic", null, null, "Travel", "open", 1, 1, user.id, user.id);
      insert.run(3, "project", 1, "topic", "Kitchen", "closed", 1, 1, user.id, user.id);
      insert.run(4, "project", 2, "topic", "Outdoor Kitchen", "open", 1, 1, user.id, user.id);

      const data = await harness.runLoader<ReturnType<typeof parentsRoute.loader>>(parentsRoute.loader, "/api/parents?type=task&q=kitch", {
        headers: { Cookie: cookie },
      });

      expect(data).not.toBeInstanceOf(Response);
      expect(data).toMatchObject({
        ok: true,
        candidates: [
          {
            id: 3,
            summary: "Kitchen",
            status: "closed",
            lineage: "House › Kitchen",
            terminalAncestors: [
              { id: 1, summary: "House", status: "completed" },
              { id: 3, summary: "Kitchen", status: "closed" },
            ],
          },
          { id: 4, summary: "Outdoor Kitchen", status: "open", lineage: "Travel › Outdoor Kitchen" },
        ],
      });
    } finally {
      harness.close();
    }
  });

  test("/api/parents can exclude the current parent for reparenting", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const user = harness.database.sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };
      const insert = harness.database.sqlite.prepare(
        "INSERT INTO work_items (id, type, parentId, parentType, summary, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      );
      insert.run(1, "topic", null, null, "House", "open", 1, 1, user.id, user.id);
      insert.run(2, "project", 1, "topic", "Kitchen", "open", 1, 1, user.id, user.id);
      insert.run(3, "project", 1, "topic", "Patio", "open", 1, 1, user.id, user.id);

      const data = await harness.runLoader<ReturnType<typeof parentsRoute.loader>>(parentsRoute.loader, "/api/parents?type=task&q=&excludeParentId=2", {
        headers: { Cookie: cookie },
      });

      expect(data).not.toBeInstanceOf(Response);
      expect(data).toMatchObject({ ok: true, candidates: [{ id: 3, summary: "Patio" }] });
    } finally {
      harness.close();
    }
  });

  test("reparenting rewrites one parent row, preserves the subtree, starts the destination, and leaves the source alone", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const user = harness.database.sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };
      const insert = harness.database.sqlite.prepare(
        "INSERT INTO work_items (id, type, parentId, parentType, summary, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      );
      insert.run(1, "topic", null, null, "House", "in_progress", 1, 1, user.id, user.id);
      insert.run(2, "project", 1, "topic", "Kitchen", "in_progress", 1, 1, user.id, user.id);
      insert.run(3, "project", 1, "topic", "Patio", "open", 1, 1, user.id, user.id);
      insert.run(4, "task", 2, "project", "Paint cabinets", "in_progress", 1, 1, user.id, user.id);
      insert.run(5, "subtask", 4, "task", "Buy primer", "open", 1, 1, user.id, user.id);

      const data = await reparentRoute.action({
        request: harness.request("/api/work-items/4/reparent", { method: "POST", headers: { Cookie: cookie }, formData: { parentId: "3" } }),
        params: { id: "4" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof reparentRoute.action>[0]);

      expect(data).toEqual({ ok: true, changed: 2 });
      expect(harness.database.sqlite.prepare("SELECT id, parentId, parentType, status, updatedAt FROM work_items ORDER BY id").all()).toEqual([
        { id: 1, parentId: null, parentType: null, status: "in_progress", updatedAt: 1 },
        { id: 2, parentId: 1, parentType: "topic", status: "in_progress", updatedAt: 1 },
        { id: 3, parentId: 1, parentType: "topic", status: "in_progress", updatedAt: expect.any(Number) },
        { id: 4, parentId: 3, parentType: "project", status: "in_progress", updatedAt: expect.any(Number) },
        { id: 5, parentId: 4, parentType: "task", status: "open", updatedAt: 1 },
      ]);
    } finally {
      harness.close();
    }
  });

  test("reparenting under a terminal parent reopens it without a separate confirmation", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const user = harness.database.sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };
      const insert = harness.database.sqlite.prepare(
        "INSERT INTO work_items (id, type, parentId, parentType, summary, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      );
      insert.run(1, "topic", null, null, "House", "completed", 1, 1, user.id, user.id);
      insert.run(2, "topic", null, null, "Travel", "open", 1, 1, user.id, user.id);
      insert.run(3, "project", 2, "topic", "San Diego", "open", 1, 1, user.id, user.id);

      const blocked = await reparentRoute.action({
        request: harness.request("/api/work-items/3/reparent", { method: "POST", headers: { Cookie: cookie }, formData: { parentId: "0" } }),
        params: { id: "3" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof reparentRoute.action>[0]);
      expect(blocked).toEqual({ ok: false, error: { field: "parentId", message: "Choose a valid Parent." } });
      expect(harness.database.sqlite.prepare("SELECT id, parentId, status, updatedAt FROM work_items ORDER BY id").all()).toEqual([
        { id: 1, parentId: null, status: "completed", updatedAt: 1 },
        { id: 2, parentId: null, status: "open", updatedAt: 1 },
        { id: 3, parentId: 2, status: "open", updatedAt: 1 },
      ]);

      const confirmed = await reparentRoute.action({
        request: harness.request("/api/work-items/3/reparent", { method: "POST", headers: { Cookie: cookie }, formData: { parentId: "1" } }),
        params: { id: "3" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof reparentRoute.action>[0]);
      expect(confirmed).toEqual({ ok: true, changed: 2 });
      expect(harness.database.sqlite.prepare("SELECT id, parentId, parentType, status FROM work_items ORDER BY id").all()).toEqual([
        { id: 1, parentId: null, parentType: null, status: "in_progress" },
        { id: 2, parentId: null, parentType: null, status: "open" },
        { id: 3, parentId: 1, parentType: "topic", status: "open" },
      ]);
    } finally {
      harness.close();
    }
  });

  test("creating a Work Item trims Summary, attaches optional Core Fields, and reopens terminal ancestors", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com,lee@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const actor = harness.database.sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };
      const assignee = harness.database.sqlite
        .prepare("INSERT INTO users (googleSubject, email, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?) RETURNING id")
        .get("lee", "lee@example.com", "Lee", 1, 1) as { id: number };
      const label = harness.database.sqlite.prepare("INSERT INTO labels (name, createdAt, updatedAt) VALUES (?, ?, ?) RETURNING id").get("House", 1, 1) as { id: number };
      const insert = harness.database.sqlite.prepare(
        "INSERT INTO work_items (id, type, parentId, parentType, summary, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      );
      insert.run(1, "topic", null, null, "House", "completed", 1, 1, actor.id, actor.id);
      insert.run(2, "project", 1, "topic", "Kitchen", "closed", 1, 1, actor.id, actor.id);

      const data = await harness.runAction<ReturnType<typeof createRoute.action>>(createRoute.action, "/api/work-items/create", {
        method: "POST",
        headers: { Cookie: cookie },
        formData: {
          type: "task",
          parentId: "2",
          summary: "  Paint cabinets  ",
          description: "  Use primer  ",
          dueDate: "2026-08-05",
          status: "in_progress",
          assigneeId: String(assignee.id),
          labelIds: String(label.id),
        },
      });

      expect(data).not.toBeInstanceOf(Response);
      expect(data).toMatchObject({ ok: true, id: expect.any(Number) });
      const createdId = (data as { ok: true; id: number }).id;
      expect(harness.database.sqlite.prepare("SELECT type, parentId, parentType, summary, description, dueDate, status, assigneeId FROM work_items WHERE id = ?").get(createdId)).toEqual({
        type: "task",
        parentId: 2,
        parentType: "project",
        summary: "Paint cabinets",
        description: "Use primer",
        dueDate: "2026-08-05",
        status: "in_progress",
        assigneeId: assignee.id,
      });
      expect(harness.database.sqlite.prepare("SELECT id, status FROM work_items WHERE id IN (1, 2) ORDER BY id").all()).toEqual([
        { id: 1, status: "in_progress" },
        { id: 2, status: "in_progress" },
      ]);
      expect(harness.database.sqlite.prepare("SELECT workItemId, labelId FROM work_item_labels").all()).toEqual([{ workItemId: createdId, labelId: label.id }]);
    } finally {
      harness.close();
    }
  });

  test("creating with an empty or over-long Summary returns a fixable typing error", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const empty = await harness.runAction<ReturnType<typeof createRoute.action>>(createRoute.action, "/api/work-items/create", {
        method: "POST",
        headers: { Cookie: cookie },
        formData: { type: "topic", summary: "   " },
      });
      const tooLong = await harness.runAction<ReturnType<typeof createRoute.action>>(createRoute.action, "/api/work-items/create", {
        method: "POST",
        headers: { Cookie: cookie },
        formData: { type: "topic", summary: "x".repeat(201) },
      });

      expect(empty).toEqual({ ok: false, error: { field: "summary", message: "Summary is required." } });
      expect(tooLong).toEqual({ ok: false, error: { field: "summary", message: "Summary must be 200 characters or fewer." } });
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
