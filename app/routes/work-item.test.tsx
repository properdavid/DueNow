import { renderToStaticMarkup } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { describe, expect, test } from "vitest";

import { createRouteTestHarness } from "~/test/route-harness";
import { loadWorkItemDetail } from "~/domain/work-items/work-items.server";
import * as assignRoute from "./api.work-items.$id.assign";
import * as descriptionRoute from "./api.work-items.$id.update-description";
import * as dueDateRoute from "./api.work-items.$id.update-due-date";
import * as summaryRoute from "./api.work-items.$id.update-summary";
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

      const detail = loadWorkItemDetail(harness.database, 3);

      expect(detail.breadcrumb).toEqual([
        { id: 1, label: "House", type: "topic" },
        { id: 2, label: "Kitchen", type: "project" },
        { id: 3, label: "Task", type: "task" },
      ]);
      expect(detail.item.summary).toBe("Paint cabinets");
      expect(detail.item.description).toBe("Use primer\nTwo coats");
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
    };
    const Stub = createRoutesStub([
      {
        path: "/items/:id",
        Component: () => (
          <WorkItemDocument
            currentUserId={1}
            detail={detail}
            members={[{ id: 1, email: "dana@example.com", name: "Dana" }]}
          />
        ),
      },
    ]);

    const markup = renderToStaticMarkup(<Stub initialEntries={["/items/1"]} />);

    expect(markup.indexOf("Topic › Topic")).toBeLessThan(markup.indexOf("Topic</h1>"));
    expect(markup.indexOf("Topic</h1>")).toBeLessThan(markup.indexOf("Status"));
    expect(markup.indexOf("Labels")).toBeLessThan(markup.indexOf("Use **plain** text"));
    expect(markup).not.toContain("<strong>");
    expect(markup).toContain("Unassigned");
    expect(markup).toContain("No Due Date");
  });
});
