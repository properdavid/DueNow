import { renderToStaticMarkup } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { afterEach, describe, expect, test, vi } from "vitest";

import { createRouteTestHarness } from "~/test/route-harness";
import * as dueRoute from "./due";

describe("Due tab route seam", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("the loader computes the radar against Today in the Household Timezone and the visible set", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-03T06:30:00.000Z"));
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com,lee@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const dana = harness.database.sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };
      const lee = harness.database.sqlite
        .prepare("INSERT INTO users (googleSubject, email, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?) RETURNING id")
        .get("lee", "lee@example.com", "Lee", 1, 1) as { id: number };
      harness.database.sqlite.prepare("UPDATE household_settings SET timezone = ? WHERE id = 1").run("America/Los_Angeles");
      const insert = harness.database.sqlite.prepare(
        "INSERT INTO work_items (id, type, parentId, parentType, summary, status, dueDate, assigneeId, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)",
      );
      insert.run(1, "topic", null, null, "House", "open", "2026-08-10", null, dana.id, dana.id);
      insert.run(2, "project", 1, "topic", "Kitchen", "open", "2026-08-07", dana.id, dana.id, dana.id);
      insert.run(3, "task", 2, "project", "Paint cabinets", "open", "2026-08-01", lee.id, dana.id, dana.id);
      insert.run(4, "topic", null, null, "Car registration", "in_progress", "2026-06-16", null, dana.id, dana.id);
      insert.run(5, "topic", null, null, "Patio permit", "open", "2026-08-20", null, dana.id, dana.id);
      insert.run(6, "topic", null, null, "Settled filing", "completed", "2026-08-02", null, dana.id, dana.id);
      insert.run(7, "topic", null, null, "Future inventory", "open", "2026-09-05", null, dana.id, dana.id);

      const mine = await harness.runLoader<ReturnType<typeof dueRoute.loader>>(dueRoute.loader, "/due", {
        headers: { Cookie: cookie },
      });

      expect(mine).not.toBeInstanceOf(Response);
      expect(mine).toMatchObject({
        today: "2026-08-02",
        scope: "mine",
        hasEverHadWorkItems: true,
        groups: {
          now: [{ summary: "Car registration", lateness: "7 weeks late" }],
          soon: [{ summary: "Kitchen", breadcrumb: [{ summary: "House" }] }],
          later: [{ summary: "Patio permit" }],
        },
        everyoneGroups: {
          now: [{ summary: "Car registration" }, { summary: "Paint cabinets" }],
          soon: [],
          later: [{ summary: "Patio permit" }],
        },
      });
    } finally {
      harness.close();
    }
  });

  test("the tab renders fixed groups, Due Cards, the filter sentence, and the steady empty card", () => {
    const loaderData = {
      today: "2026-08-02",
      scope: "mine" as const,
      hasEverHadWorkItems: true,
      groups: {
        now: [
          {
            id: 4,
            type: "topic" as const,
            parentId: null,
            status: "in_progress" as const,
            dueDate: "2026-06-16",
            summary: "Car registration",
            assigneeId: null,
            assignee: null,
            breadcrumb: [],
            relativeDate: "7 weeks late",
            absoluteDate: "Tue, Jun 16",
            lateness: "7 weeks late",
            urgency: "overdue" as const,
          },
        ],
        soon: [],
        later: [
          {
            id: 8,
            type: "task" as const,
            parentId: 2,
            status: "open" as const,
            dueDate: "2026-08-20",
            summary: "Reserve venue",
            assigneeId: 1,
            assignee: { id: 1, name: "Dana", email: "dana@example.com" },
            breadcrumb: [
              { id: 1, summary: "Travel", type: "topic" as const },
              { id: 2, summary: "Birthday", type: "project" as const },
            ],
            relativeDate: "in 18 days",
            absoluteDate: "Thu, Aug 20",
            lateness: null,
            urgency: "later" as const,
          },
        ],
      },
      everyoneGroups: {
        now: [],
        soon: [],
        later: [],
      },
      user: { id: 1, email: "dana@example.com", name: "Dana", theme: "system" as const },
    };
    const Stub = createRoutesStub([
      {
        path: "/due",
        Component: () => dueRoute.default({ loaderData, params: {}, matches: [] } as unknown as Parameters<typeof dueRoute.default>[0]),
      },
    ]);

    const markup = renderToStaticMarkup(<Stub initialEntries={["/due"]} />);

    expect(markup).toContain("Showing your work and unassigned");
    expect(markup).toContain("Show everyone");
    expect(markup).toContain("Due Now");
    expect(markup).toContain("1");
    expect(markup).toContain("Due Soon");
    expect(markup).toContain("Nothing due in the next 7 days");
    expect(markup).toContain("Due Later");
    expect(markup).toContain("Car registration");
    expect(markup).toContain("7 weeks late");
    expect(markup).toContain("Tue, Jun 16");
    expect(markup).toContain("Reserve venue");
    expect(markup).toContain("Travel › Birthday");
    expect(markup).toContain('href="/due/8"');
    expect(markup).not.toContain("Labels");
  });

  test("the default empty visible set still offers Show everyone when other work is on the radar", () => {
    const loaderData = {
      today: "2026-08-02",
      scope: "mine" as const,
      hasEverHadWorkItems: true,
      groups: { now: [], soon: [], later: [] },
      everyoneGroups: {
        now: [
          {
            id: 3,
            type: "task" as const,
            parentId: 2,
            status: "open" as const,
            dueDate: "2026-08-01",
            summary: "Paint cabinets",
            assigneeId: 2,
            assignee: { id: 2, name: "Lee", email: "lee@example.com" },
            breadcrumb: [],
            relativeDate: "1 day late",
            absoluteDate: "Sat, Aug 1",
            lateness: "1 day late",
            urgency: "overdue" as const,
          },
        ],
        soon: [],
        later: [],
      },
      user: { id: 1, email: "dana@example.com", name: "Dana", theme: "system" as const },
    };
    const Stub = createRoutesStub([
      {
        path: "/due",
        Component: () => dueRoute.default({ loaderData, params: {}, matches: [] } as unknown as Parameters<typeof dueRoute.default>[0]),
      },
    ]);

    const markup = renderToStaticMarkup(<Stub initialEntries={["/due"]} />);

    expect(markup).toContain("Showing your work and unassigned");
    expect(markup).toContain("Show everyone");
    expect(markup).toContain("Nothing overdue or due today");
    expect(markup).not.toContain("Nothing on the radar");
  });
});
