import { renderToStaticMarkup } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { describe, expect, test } from "vitest";

import { createRouteTestHarness } from "~/test/route-harness";
import { CreationDialogProvider } from "~/components/shell/creation-dialog";
import { loadWorkItemDetail } from "~/domain/work-items/work-items.server";
import * as assignRoute from "./api.work-items.$id.assign";
import * as attachLabelRoute from "./api.work-items.$id.attach-label";
import * as createLabelRoute from "./api.work-items.$id.create-label";
import * as detachLabelRoute from "./api.work-items.$id.detach-label";
import * as descriptionRoute from "./api.work-items.$id.update-description";
import * as dueDateRoute from "./api.work-items.$id.update-due-date";
import * as summaryRoute from "./api.work-items.$id.update-summary";
import * as settleRoute from "./api.work-items.$id.settle";
import * as startRoute from "./api.work-items.$id.start";
import * as unsettleRoute from "./api.work-items.$id.unsettle";
import { WorkItemDocument } from "./work-item";

describe("Work Item detail route seam", () => {
  test("the read model names ancestors and the selected Work Item's type", () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const user = harness.database.sqlite
        .prepare("INSERT INTO users (googleSubject, email, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?) RETURNING id")
        .get("dana", "dana@example.com", "Dana", 1, 1) as { id: number };
      const insert = harness.database.sqlite.prepare(
        "INSERT INTO work_items (id, type, parentId, parentType, summary, description, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      );
      insert.run(1, "topic", null, null, "House", "", "open", 1, 1, user.id, user.id);
      insert.run(2, "project", 1, "topic", "Kitchen", "", "open", 1, 1, user.id, user.id);
      insert.run(3, "task", 2, "project", "Paint cabinets", "Use primer\nTwo coats", "open", 1, 1, user.id, user.id);
      insert.run(4, "subtask", 3, "task", "Buy primer", "", "open", 1, 1, user.id, user.id);
      insert.run(5, "subtask", 3, "task", "Get swatches", "", "completed", 1, 1, user.id, user.id);
      const errands = harness.database.sqlite.prepare("INSERT INTO labels (name, createdAt, updatedAt) VALUES (?, ?, ?) RETURNING id").get("Errands", 1, 1) as { id: number };
      const house = harness.database.sqlite.prepare("INSERT INTO labels (name, createdAt, updatedAt) VALUES (?, ?, ?) RETURNING id").get("House", 1, 1) as { id: number };
      harness.database.sqlite.prepare("INSERT INTO work_item_labels (workItemId, labelId) VALUES (?, ?)").run(3, house.id);
      harness.database.sqlite.prepare("INSERT INTO work_item_labels (workItemId, labelId) VALUES (?, ?)").run(3, errands.id);

      const detail = loadWorkItemDetail(harness.database, 3);

      expect(detail.breadcrumb).toEqual([
        { id: 1, label: "House", type: "topic" },
        { id: 2, label: "Kitchen", type: "project" },
        { id: 3, label: "Task", type: "task" },
      ]);
      expect(detail.item.summary).toBe("Paint cabinets");
      expect(detail.item.description).toBe("Use primer\nTwo coats");
      expect(detail.startCascadeAncestors.map((ancestor) => ancestor.summary)).toEqual(["Kitchen", "House"]);
      expect(detail.unfinishedDescendants).toEqual([{ id: 4, summary: "Buy primer", type: "subtask" }]);
      expect(detail.children.map((child) => child.summary)).toEqual(["Buy primer", "Get swatches"]);
      expect(detail.children[0].unfinishedDescendants).toEqual([]);
      expect(detail.labels).toEqual([
        { id: errands.id, name: "Errands" },
        { id: house.id, name: "House" },
      ]);
    } finally {
      harness.close();
    }
  });

  test("status update route gates Settle Cascade until confirmation and sweeps server-computed descendants", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const actor = harness.database.sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };
      const insert = harness.database.sqlite.prepare(
        "INSERT INTO work_items (id, type, parentId, parentType, summary, description, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, '', ?, 1, 1, ?, ?)",
      );
      insert.run(1, "topic", null, null, "House", "open", actor.id, actor.id);
      insert.run(2, "project", 1, "topic", "Kitchen", "open", actor.id, actor.id);
      insert.run(3, "task", 2, "project", "Paint cabinets", "open", actor.id, actor.id);
      insert.run(4, "subtask", 3, "task", "Buy primer", "in_progress", actor.id, actor.id);
      insert.run(5, "task", 2, "project", "Choose colour", "completed", actor.id, actor.id);

      const unconfirmed = await settleRoute.action({
        request: harness.request("/api/work-items/2/settle", { method: "POST", headers: { Cookie: cookie }, formData: { id: "2", status: "closed", confirmed: "false" } }),
        params: { id: "2" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof settleRoute.action>[0]);
      expect(unconfirmed).toEqual({ ok: false, error: { field: "confirmed", message: "Confirm the Settle Cascade first." } });
      expect(harness.database.sqlite.prepare("SELECT id, status, updatedAt FROM work_items ORDER BY id").all()).toEqual([
        { id: 1, status: "open", updatedAt: 1 },
        { id: 2, status: "open", updatedAt: 1 },
        { id: 3, status: "open", updatedAt: 1 },
        { id: 4, status: "in_progress", updatedAt: 1 },
        { id: 5, status: "completed", updatedAt: 1 },
      ]);

      const confirmed = await settleRoute.action({
        request: harness.request("/api/work-items/2/settle", { method: "POST", headers: { Cookie: cookie }, formData: { id: "2", status: "closed", confirmed: "true" } }),
        params: { id: "2" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof settleRoute.action>[0]);
      expect(confirmed).toEqual({ ok: true, changed: 3 });
      expect(harness.database.sqlite.prepare("SELECT id, status, updatedBy, updatedAt FROM work_items ORDER BY id").all()).toEqual([
        { id: 1, status: "open", updatedBy: actor.id, updatedAt: 1 },
        { id: 2, status: "closed", updatedBy: actor.id, updatedAt: expect.any(Number) },
        { id: 3, status: "closed", updatedBy: actor.id, updatedAt: expect.any(Number) },
        { id: 4, status: "closed", updatedBy: actor.id, updatedAt: expect.any(Number) },
        { id: 5, status: "completed", updatedBy: actor.id, updatedAt: 1 },
      ]);
    } finally {
      harness.close();
    }
  });

  test("un-settling a child under a terminal parent waits for the Reopen Notice and reopens ancestors", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const actor = harness.database.sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };
      const insert = harness.database.sqlite.prepare(
        "INSERT INTO work_items (id, type, parentId, parentType, summary, description, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, '', ?, 1, 1, ?, ?)",
      );
      insert.run(1, "topic", null, null, "House", "completed", actor.id, actor.id);
      insert.run(2, "project", 1, "topic", "Kitchen", "completed", actor.id, actor.id);
      insert.run(3, "task", 2, "project", "Paint cabinets", "closed", actor.id, actor.id);

      const unconfirmed = await unsettleRoute.action({
        request: harness.request("/api/work-items/3/unsettle", { method: "POST", headers: { Cookie: cookie }, formData: { confirmed: "false" } }),
        params: { id: "3" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof unsettleRoute.action>[0]);
      expect(unconfirmed).toEqual({ ok: false, error: { field: "confirmed", message: "Confirm the Reopen Notice first." } });
      expect(harness.database.sqlite.prepare("SELECT id, status, updatedAt FROM work_items ORDER BY id").all()).toEqual([
        { id: 1, status: "completed", updatedAt: 1 },
        { id: 2, status: "completed", updatedAt: 1 },
        { id: 3, status: "closed", updatedAt: 1 },
      ]);

      const confirmed = await unsettleRoute.action({
        request: harness.request("/api/work-items/3/unsettle", { method: "POST", headers: { Cookie: cookie }, formData: { confirmed: "true" } }),
        params: { id: "3" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof unsettleRoute.action>[0]);
      expect(confirmed).toEqual({ ok: true, changed: 3 });
      expect(harness.database.sqlite.prepare("SELECT id, status, updatedBy FROM work_items ORDER BY id").all()).toEqual([
        { id: 1, status: "in_progress", updatedBy: actor.id },
        { id: 2, status: "in_progress", updatedBy: actor.id },
        { id: 3, status: "open", updatedBy: actor.id },
      ]);
    } finally {
      harness.close();
    }
  });

  test("status update route announces behavior server-side: start cascades, un-settle does not", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const actor = harness.database.sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };
      const insert = harness.database.sqlite.prepare(
        "INSERT INTO work_items (id, type, parentId, parentType, summary, description, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, '', ?, 1, 1, ?, ?)",
      );
      insert.run(1, "topic", null, null, "House", "open", actor.id, actor.id);
      insert.run(2, "project", 1, "topic", "Kitchen", "open", actor.id, actor.id);
      insert.run(3, "task", 2, "project", "Paint cabinets", "open", actor.id, actor.id);
      insert.run(4, "subtask", 3, "task", "Buy primer", "completed", actor.id, actor.id);

      const started = await startRoute.action({
        request: harness.request("/api/work-items/3/start", { method: "POST", headers: { Cookie: cookie }, formData: { id: "3", status: "in_progress", confirmed: "false" } }),
        params: { id: "3" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof startRoute.action>[0]);
      expect(started).toEqual({ ok: true, changed: 3 });
      expect(harness.database.sqlite.prepare("SELECT id, status FROM work_items ORDER BY id").all()).toEqual([
        { id: 1, status: "in_progress" },
        { id: 2, status: "in_progress" },
        { id: 3, status: "in_progress" },
        { id: 4, status: "completed" },
      ]);

      const unsettled = await unsettleRoute.action({
        request: harness.request("/api/work-items/4/unsettle", { method: "POST", headers: { Cookie: cookie }, formData: { id: "4", status: "open", confirmed: "false" } }),
        params: { id: "4" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof unsettleRoute.action>[0]);
      expect(unsettled).toEqual({ ok: true, changed: 1 });
      expect(harness.database.sqlite.prepare("SELECT id, status FROM work_items ORDER BY id").all()).toEqual([
        { id: 1, status: "in_progress" },
        { id: 2, status: "in_progress" },
        { id: 3, status: "in_progress" },
        { id: 4, status: "open" },
      ]);
    } finally {
      harness.close();
    }
  });

  test("field update routes validate and persist only their own Core Field", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com,lee@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const actor = harness.database.sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };
      const assignee = harness.database.sqlite
        .prepare("INSERT INTO users (googleSubject, email, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?) RETURNING id")
        .get("lee", "lee@example.com", "Lee", 1, 1) as { id: number };
      harness.database.sqlite
        .prepare("INSERT INTO work_items (id, type, parentId, parentType, summary, description, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(1, "topic", null, null, "House", "", "open", 1, 1, actor.id, actor.id);

      const summary = await summaryRoute.action({
        request: harness.request("/api/work-items/1/update-summary", { method: "POST", headers: { Cookie: cookie }, formData: { summary: "  House repairs  " } }),
        params: { id: "1" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof summaryRoute.action>[0]);
      const description = await descriptionRoute.action({
        request: harness.request("/api/work-items/1/update-description", { method: "POST", headers: { Cookie: cookie }, formData: { description: "  Plain **text**  " } }),
        params: { id: "1" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof descriptionRoute.action>[0]);
      const assign = await assignRoute.action({
        request: harness.request("/api/work-items/1/assign", { method: "POST", headers: { Cookie: cookie }, formData: { assigneeId: String(assignee.id) } }),
        params: { id: "1" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof assignRoute.action>[0]);
      const dueDate = await dueDateRoute.action({
        request: harness.request("/api/work-items/1/update-due-date", { method: "POST", headers: { Cookie: cookie }, formData: { dueDate: "2026-08-03" } }),
        params: { id: "1" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof dueDateRoute.action>[0]);

      expect(summary).toEqual({ ok: true });
      expect(description).toEqual({ ok: true });
      expect(assign).toEqual({ ok: true });
      expect(dueDate).toEqual({ ok: true });
      expect(harness.database.sqlite.prepare("SELECT summary, description, assigneeId, dueDate FROM work_items WHERE id = 1").get()).toEqual({
        summary: "House repairs",
        description: "  Plain **text**  ",
        assigneeId: assignee.id,
        dueDate: "2026-08-03",
      });

      const invalidAssignee = await assignRoute.action({
        request: harness.request("/api/work-items/1/assign", { method: "POST", headers: { Cookie: cookie }, formData: { assigneeId: "not-a-number" } }),
        params: { id: "1" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof assignRoute.action>[0]);
      expect(invalidAssignee).toEqual({ ok: false, error: { field: "assigneeId", message: "Choose a valid Assignee." } });
      expect(harness.database.sqlite.prepare("SELECT assigneeId FROM work_items WHERE id = 1").get()).toEqual({ assigneeId: assignee.id });
    } finally {
      harness.close();
    }
  });

  test("description fences are enforced server-side with the real count and limit", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const user = harness.database.sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };
      harness.database.sqlite
        .prepare("INSERT INTO work_items (id, type, parentId, parentType, summary, description, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(1, "topic", null, null, "House", "Keep me", "open", 1, 1, user.id, user.id);

      const data = await descriptionRoute.action({
        request: harness.request("/api/work-items/1/update-description", {
          method: "POST",
          headers: { Cookie: cookie },
          formData: { description: ` ${"x".repeat(20_001)} ` },
        }),
        params: { id: "1" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof descriptionRoute.action>[0]);

      expect(data).toEqual({
        ok: false,
        error: { field: "description", message: "Description is too long (20,001 characters, limit 20,000)." },
      });
      expect(harness.database.sqlite.prepare("SELECT description FROM work_items WHERE id = 1").get()).toEqual({ description: "Keep me" });
    } finally {
      harness.close();
    }
  });

  test("Label routes attach, detach and create Labels from the Detail View picker", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const user = harness.database.sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };
      harness.database.sqlite
        .prepare("INSERT INTO work_items (id, type, parentId, parentType, summary, description, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(1, "topic", null, null, "House", "", "open", 1, 1, user.id, user.id);
      const errands = harness.database.sqlite.prepare("INSERT INTO labels (name, createdAt, updatedAt) VALUES (?, ?, ?) RETURNING id").get("Errands", 1, 1) as { id: number };

      const attached = await attachLabelRoute.action({
        request: harness.request("/api/work-items/1/attach-label", { method: "POST", headers: { Cookie: cookie }, formData: { labelId: String(errands.id) } }),
        params: { id: "1" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof attachLabelRoute.action>[0]);
      expect(attached).toEqual({ ok: true });
      expect(harness.database.sqlite.prepare("SELECT workItemId, labelId FROM work_item_labels").all()).toEqual([{ workItemId: 1, labelId: errands.id }]);

      const duplicateName = await createLabelRoute.action({
        request: harness.request("/api/work-items/1/create-label", { method: "POST", headers: { Cookie: cookie }, formData: { name: " errands " } }),
        params: { id: "1" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof createLabelRoute.action>[0]);
      expect(duplicateName).toEqual({ ok: false, error: { field: "name", message: "A Label with that name already exists." } });

      const created = await createLabelRoute.action({
        request: harness.request("/api/work-items/1/create-label", { method: "POST", headers: { Cookie: cookie }, formData: { name: " Hardware " } }),
        params: { id: "1" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof createLabelRoute.action>[0]);
      expect(created).toEqual({ ok: true });
      expect(harness.database.sqlite.prepare("SELECT name FROM labels ORDER BY lower(name)").all()).toEqual([{ name: "Errands" }, { name: "Hardware" }]);
      expect(harness.database.sqlite.prepare("SELECT labels.name FROM labels INNER JOIN work_item_labels ON labels.id = work_item_labels.labelId ORDER BY lower(labels.name)").all()).toEqual([
        { name: "Errands" },
        { name: "Hardware" },
      ]);

      const emptyName = await createLabelRoute.action({
        request: harness.request("/api/work-items/1/create-label", { method: "POST", headers: { Cookie: cookie }, formData: { name: "   " } }),
        params: { id: "1" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof createLabelRoute.action>[0]);
      expect(emptyName).toEqual({ ok: false, error: { field: "name", message: "Label name is required." } });

      const longName = await createLabelRoute.action({
        request: harness.request("/api/work-items/1/create-label", { method: "POST", headers: { Cookie: cookie }, formData: { name: "x".repeat(31) } }),
        params: { id: "1" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof createLabelRoute.action>[0]);
      expect(longName).toEqual({ ok: false, error: { field: "name", message: "Label name must be 30 characters or fewer." } });

      const detached = await detachLabelRoute.action({
        request: harness.request("/api/work-items/1/detach-label", { method: "POST", headers: { Cookie: cookie }, formData: { labelId: String(errands.id) } }),
        params: { id: "1" },
        context: { database: harness.database, env: harness.env },
      } as unknown as Parameters<typeof detachLabelRoute.action>[0]);
      expect(detached).toEqual({ ok: true });
      expect(harness.database.sqlite.prepare("SELECT labels.name FROM labels INNER JOIN work_item_labels ON labels.id = work_item_labels.labelId").all()).toEqual([{ name: "Hardware" }]);
    } finally {
      harness.close();
    }
  });
});

describe("Work Item detail rendering seam", () => {
  test("renders document order with chips and plain Description text for every type", () => {
    const detail = {
      breadcrumb: [{ id: 1, label: "Topic", type: "topic" as const }],
      item: {
        id: 1,
        type: "topic" as const,
        parentId: null,
        status: "open" as const,
        dueDate: null,
        summary: "Topic",
        description: "Use **plain** text",
        assigneeId: null,
        assignee: null,
      },
      labels: [{ id: 1, name: "House" }],
      children: [],
      unfinishedDescendants: [],
      reopenNotice: [],
      startCascadeAncestors: [],
    };
    const Stub = createRoutesStub([
      {
        path: "/items/:id",
        Component: () => (
          <CreationDialogProvider members={[{ id: 1, email: "dana@example.com", name: "Dana" }]} labels={[]}>
            <WorkItemDocument
              currentUserId={1}
              detail={detail}
              labelVocabulary={[{ id: 1, name: "House" }]}
              members={[{ id: 1, email: "dana@example.com", name: "Dana" }]}
            />
          </CreationDialogProvider>
        ),
      },
    ]);

    const markup = renderToStaticMarkup(<Stub initialEntries={["/items/1"]} />);

    expect(markup.indexOf("Topic › Topic")).toBeLessThan(markup.indexOf("Topic</h1>"));
    expect(markup.indexOf("Topic</h1>")).toBeLessThan(markup.indexOf("Status: Open"));
    expect(markup.indexOf("Labels")).toBeLessThan(markup.indexOf("Use **plain** text"));
    expect(markup).not.toContain("<strong>");
    expect(markup).toContain("Unassigned");
    expect(markup).toContain("No Due Date");
    expect(markup).not.toContain("Reparent…");
  });

  test("renders the Children Checklist with a settled reveal and omits it for Subtasks", () => {
    const members = [{ id: 1, email: "dana@example.com", name: "Dana" }];
    const projectDetail = {
      breadcrumb: [{ id: 1, label: "House", type: "topic" as const }, { id: 2, label: "Project", type: "project" as const }],
      item: {
        id: 2,
        type: "project" as const,
        parentId: 1,
        status: "open" as const,
        dueDate: null,
        summary: "Kitchen",
        description: "",
        assigneeId: null,
        assignee: null,
      },
      labels: [],
      children: [
        {
          id: 3,
          type: "task" as const,
          parentId: 2,
          status: "open" as const,
          dueDate: "2026-08-03",
          summary: "Paint cabinets",
          description: "",
          assigneeId: 1,
          assignee: members[0],
          unfinishedDescendants: [],
          reopenNotice: [],
        },
        {
          id: 4,
          type: "task" as const,
          parentId: 2,
          status: "completed" as const,
          dueDate: null,
          summary: "Choose colour",
          description: "",
          assigneeId: null,
          assignee: null,
          unfinishedDescendants: [],
          reopenNotice: [],
        },
      ],
      unfinishedDescendants: [{ id: 3, summary: "Paint cabinets", type: "task" as const }],
      reopenNotice: [],
      startCascadeAncestors: [],
    };
    const Stub = createRoutesStub([
      {
        path: "/items/:id",
        Component: () => (
          <CreationDialogProvider members={members} labels={[]}>
            <WorkItemDocument currentUserId={1} detail={projectDetail} labelVocabulary={[]} members={members} />
          </CreationDialogProvider>
        ),
      },
    ]);

    const markup = renderToStaticMarkup(<Stub initialEntries={["/items/2"]} />);

    expect(markup).toContain("Tasks");
    expect(markup).toContain("Paint cabinets");
    expect(markup).toContain("2026-08-03");
    expect(markup).toContain("Dana");
    expect(markup).toContain("1 settled");
    expect(markup).not.toContain("Choose colour");
    expect(markup).toContain("Add Task");
    expect(markup).toContain("Reparent…");

    const subtaskDetail = { ...projectDetail, item: { ...projectDetail.item, id: 5, type: "subtask" as const }, children: [] };
    const SubtaskStub = createRoutesStub([
      {
        path: "/items/:id",
        Component: () => (
          <CreationDialogProvider members={members} labels={[]}>
            <WorkItemDocument currentUserId={1} detail={subtaskDetail} labelVocabulary={[]} members={members} />
          </CreationDialogProvider>
        ),
      },
    ]);
    const subtaskMarkup = renderToStaticMarkup(<SubtaskStub initialEntries={["/items/5"]} />);
    expect(subtaskMarkup).not.toContain("Add Subtask");
  });
});
