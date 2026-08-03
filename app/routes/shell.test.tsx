import { renderToStaticMarkup } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { describe, expect, test } from "vitest";

import { themeClassNameFor, themeColorMetaFor } from "~/root";
import { createRouteTestHarness } from "~/test/route-harness";
import * as shellRoute from "./shell";

describe("navigation shell route seam", () => {
  test("the shell loader is the protected reference-data source", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      harness.database.sqlite.prepare("UPDATE users SET theme = 'dark' WHERE email = ?").run("dana@example.com");
      harness.database.sqlite
        .prepare("INSERT INTO labels (name, createdAt, updatedAt) VALUES (?, ?, ?)")
        .run("House", 1, 1);

      const data = await harness.runLoader<ReturnType<typeof shellRoute.loader>>(shellRoute.loader, "/due", {
        headers: { Cookie: cookie },
      });

      expect(data).not.toBeInstanceOf(Response);
      expect(data).toMatchObject({
        user: { email: "dana@example.com", name: "Dana", theme: "dark" },
        members: [{ email: "dana@example.com", name: "Dana", theme: "dark" }],
        labels: [{ name: "House" }],
        householdTimezone: { timezone: expect.any(String) },
      });
    } finally {
      harness.close();
    }
  });

  test("the shell renders four destinations and both creation entry points", () => {
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: () =>
          shellRoute.default({
            loaderData: {
              user: { id: 1, email: "dana@example.com", name: "Dana", theme: "system" },
              members: [{ id: 1, email: "dana@example.com", name: "Dana", theme: "system" }],
              labels: [],
              householdTimezone: { timezone: "UTC" },
            },
            params: {},
            matches: [],
          } as unknown as Parameters<typeof shellRoute.default>[0]),
        children: [
          { path: "due", Component: () => <main>Due placeholder</main> },
          { path: "items", Component: () => <main>Work Items placeholder</main> },
          { path: "search", Component: () => <main>Search placeholder</main>, handle: { layout: "full" } },
          { path: "settings", Component: () => <main>Settings placeholder</main> },
        ],
      },
    ]);

    const markup = renderToStaticMarkup(<Stub initialEntries={["/due"]} />);

    for (const destination of shellRoute.destinations) {
      expect(markup).toContain(`href="${destination.href}"`);
      expect(markup).toContain(destination.label);
    }
    expect(markup).toContain("DueNow");
    expect(markup).toContain("New Work Item");
    expect(markup).toContain('aria-label="New Work Item"');
    expect(markup).toContain("lg:fixed");
  });

  test("root theme helpers render explicit theme class and server theme-color", () => {
    expect(themeClassNameFor("system")).toBeUndefined();
    expect(themeClassNameFor("light")).toBe("light");
    expect(themeClassNameFor("dark")).toBe("dark");
    expect(themeColorMetaFor("system")).toEqual([
      { name: "theme-color", content: "hsl(245 55% 52%)", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "hsl(245 60% 68%)", media: "(prefers-color-scheme: dark)" },
    ]);
    expect(themeColorMetaFor("dark")).toEqual([{ name: "theme-color", content: "hsl(245 60% 68%)" }]);
  });
});
