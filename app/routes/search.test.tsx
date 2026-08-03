import { describe, expect, test } from "vitest";

import { createRouteTestHarness } from "~/test/route-harness";
import * as searchRoute from "./search";

describe("Search route seam", () => {
  test("the loader reads URL Filter Bar parameters and returns capped results with the true Result Count", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });
    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const user = harness.database.sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };
      const insert = harness.database.sqlite.prepare(
        "INSERT INTO work_items (id, type, parentId, parentType, summary, description, assigneeId, status, dueDate, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      );
      insert.run(1, "topic", null, null, "House", "", user.id, "open", null, 1, 1, user.id, user.id);
      insert.run(2, "project", 1, "topic", "Kitchen", "paint cabinets", null, "open", "2026-08-02", 1, 2, user.id, user.id);
      insert.run(3, "task", 2, "project", "Prime cabinets", "paint primer", null, "in_progress", "2026-08-03", 1, 3, user.id, user.id);

      const data = await harness.runLoader<ReturnType<typeof searchRoute.loader>>(
        searchRoute.loader,
        "/search?keyword=paint&type=project,task&status=open,in_progress&assignee=unassigned&parent=1&parent=2&due=between&start=2026-08-01&end=2026-08-03&sort=due&direction=desc",
        { headers: { Cookie: cookie } },
      );

      expect(data).not.toBeInstanceOf(Response);
      expect(data).toMatchObject({
        resultCount: 2,
        limit: 200,
        rows: [
          { id: 3, summary: "Prime cabinets", parentSummary: "Kitchen" },
          { id: 2, summary: "Kitchen", parentSummary: "House" },
        ],
      });
    } finally {
      harness.close();
    }
  });
});
