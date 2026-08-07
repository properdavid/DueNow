import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoutesStub } from "react-router";

import { createRouteTestHarness } from "~/test/route-harness";
import { dueLabels } from "./search-params";
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

      const data = await harness.runLoader<ReturnType<typeof searchRoute.loader>>(searchRoute.loader, "/search?q=paint&type=project,task&status=open,in_progress&who=unassigned&parent=1&parent=2&due=between&from=2026-08-01&to=2026-08-03&sort=due&dir=desc", { headers: { Cookie: cookie } });

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

describe("Search tab rendering seam", () => {
  test("renders the Filter Bar, Result Count, wide Results Table and compact stacked rows without mutations", () => {
    const markup = renderSearch({
      rows: [
        {
          id: 3,
          type: "task",
          parentId: 2,
          parentSummary: "Kitchen",
          summary: "Prime cabinets",
          description: "",
          assigneeId: null,
          assignee: null,
          status: "in_progress",
          dueDate: "2026-08-03",
          updatedAt: Date.UTC(2026, 7, 2),
        },
      ],
      resultCount: 2412,
      limit: 200,
      user: { id: 1, email: "dana@example.com", name: "Dana", theme: "system" },
      selectedParents: [{ id: 2, summary: "Kitchen" }],
    }, "/search?q=paint&type=task&status=in_progress&who=unassigned&parent=2&due=before&from=2026-08-04&labels=7&sort=due&dir=desc");

    expect(markup).toContain("Search");
    expect(markup).toContain("Showing 200 of 2,412 — narrow your search to see the rest.");
    expect(markup).toContain("Type: Task");
    expect(markup).toContain("Status: In Progress");
    expect(markup).toContain("Assignee: Unassigned");
    expect(markup).toContain("Parent: Kitchen");
    expect(markup).toContain("Due Date: Before Aug 4");
    expect(markup).toContain("Labels:");
    expect(markup).toContain("<table");
    expect(markup).toContain("<th");
    expect(markup).toContain("Prime cabinets");
    expect(markup).toContain("Aug 3");
    expect(markup).toContain("#3");
    expect(markup).toContain("Sort: Due \u2193");
    expect(markup).toContain("Clear");
  });

  test("offers Clear only once a filter is on, and never reaches the Sort Order", () => {
    const unfiltered = renderSearch({ rows: [], resultCount: 0, limit: 200, user: { id: 1, email: "dana@example.com", name: "Dana", theme: "system" }, selectedParents: [] }, "/search?q=paint&sort=due&dir=desc");
    const filtered = renderSearch({ rows: [], resultCount: 0, limit: 200, user: { id: 1, email: "dana@example.com", name: "Dana", theme: "system" }, selectedParents: [] }, "/search?q=paint&type=task&sort=due&dir=desc");

    expect(unfiltered).not.toContain(">Clear<");
    expect(filtered).toContain(">Clear<");
    expect(filtered).toContain("/search?q=paint&amp;sort=due&amp;dir=desc");
  });

  test("uses distinct empty copy for First Run and missed Keyword states", () => {
    const firstRun = renderSearch({ rows: [], resultCount: 0, limit: 200, user: { id: 1, email: "dana@example.com", name: "Dana", theme: "system" }, selectedParents: [] });
    const missedKeyword = renderSearch({ rows: [], resultCount: 0, limit: 200, user: { id: 1, email: "dana@example.com", name: "Dana", theme: "system" }, selectedParents: [] }, "/search?q=patio");

    expect(firstRun).toContain("Nothing searchable yet");
    expect(firstRun).toContain("Create your first work item and it will appear here.");
    expect(missedKeyword).toContain("No matching work items");
    expect(missedKeyword).toContain("Change the Filter Bar or try a different Keyword.");
  });
});

describe("Due Date filter seam", () => {
  test.each([
    ["any", false, false],
    ["overdue", false, false],
    ["none", false, false],
    ["before", true, false],
    ["after", true, false],
    ["between", true, true],
  ])("the %s mode reveals only the date inputs the shared rule allows", (due, expectedFrom, expectedTo) => {
    const markup = renderSearch(
      { rows: [], resultCount: 0, limit: 200, user: { id: 1, email: "dana@example.com", name: "Dana", theme: "system" }, selectedParents: [] },
      `/search?due=${due}`,
    );
    const label = dueLabels[due as keyof typeof dueLabels];

    expect(markup.includes(`aria-label="${label} from"`)).toBe(expectedFrom);
    expect(markup.includes(`aria-label="${label} to"`)).toBe(expectedTo);
  });

  test.each([
    ["due=before", "Due Date: Before"],
    ["due=after", "Due Date: After"],
    ["due=between", "Due Date: Between"],
    ["due=between&from=2026-08-04", "Due Date: Between"],
    ["due=between&to=2026-08-06", "Due Date: Between"],
    ["due=before&from=2026-08-04", "Due Date: Before Aug 4"],
    ["due=between&from=2026-08-04&to=2026-08-06", "Due Date: Between Aug 4 and Aug 6"],
  ])("the summary for %s names only the dates that are set", (query, expected) => {
    const markup = renderSearch(
      { rows: [], resultCount: 0, limit: 200, user: { id: 1, email: "dana@example.com", name: "Dana", theme: "system" }, selectedParents: [] },
      `/search?${query}`,
    );

    expect(markup).toContain(expected);
    expect(markup).not.toContain("Before No due date");
    expect(markup).not.toContain("and No due date");
  });
});

function renderSearch(loaderData: React.ComponentProps<typeof searchRoute.default>["loaderData"], path = "/search") {
  const Stub = createRoutesStub([
    {
      path: "/search",
      Component: () => searchRoute.default({ loaderData, params: {}, matches: [] } as unknown as Parameters<typeof searchRoute.default>[0]),
    },
  ]);
  return renderToStaticMarkup(<Stub initialEntries={[path]} />);
}
