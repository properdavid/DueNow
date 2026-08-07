import { renderToStaticMarkup } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { describe, expect, test } from "vitest";

import { ErrorBoundary, isUnreachableRouteError, links, themeClassNameFor, themeColorMetaFor } from "~/root";
import { createRouteTestHarness } from "~/test/route-harness";
import * as settingsRoute from "./settings";
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
    expect(markup).toContain("env(safe-area-inset-bottom)");
  });

  test("a route that declares fab: none loses the compact create button but keeps the sidebar one", () => {
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
          { path: "settings", Component: () => <main>Settings placeholder</main>, handle: settingsRoute.handle },
        ],
      },
    ]);

    expect(settingsRoute.handle).toEqual({ fab: "none" });
    expect(renderToStaticMarkup(<Stub initialEntries={["/settings"]} />)).not.toContain('aria-label="New Work Item"');
    expect(renderToStaticMarkup(<Stub initialEntries={["/due"]} />)).toContain('aria-label="New Work Item"');
    expect(renderToStaticMarkup(<Stub initialEntries={["/settings"]} />)).toContain("New Work Item");
  });

  test("root theme helpers render explicit theme class and server theme-color", () => {
    expect(themeClassNameFor("system")).toBeUndefined();
    expect(themeClassNameFor("light")).toBe("light");
    expect(themeClassNameFor("dark")).toBe("dark");
    expect(themeColorMetaFor("system")).toEqual([
      { name: "theme-color", content: ["#4d", "41", "c8"].join(""), media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: ["#85", "7c", "de"].join(""), media: "(prefers-color-scheme: dark)" },
    ]);
    expect(themeColorMetaFor("dark")).toEqual([{ name: "theme-color", content: ["#85", "7c", "de"].join("") }]);
  });

  test("root links expose the install manifest and one App Icon artwork", () => {
    expect(links()).toEqual([
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icons/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon-180.png", sizes: "180x180" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon-167.png", sizes: "167x167" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon-152.png", sizes: "152x152" },
    ]);
  });

  test("route errors distinguish an unreachable server from server responses", () => {
    expect(isUnreachableRouteError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isUnreachableRouteError(new Response("Nope", { status: 500, statusText: "Server Error" }))).toBe(false);

    const unreachableMarkup = renderToStaticMarkup(<ErrorBoundary error={new TypeError("Failed to fetch")} params={{}} loaderData={undefined} actionData={undefined} />);
    expect(unreachableMarkup).toContain("Can&#x27;t reach DueNow");
    expect(unreachableMarkup).toContain("Retry");

    const serverMarkup = renderToStaticMarkup(<ErrorBoundary error={new Response("Nope", { status: 500, statusText: "Server Error" })} params={{}} loaderData={undefined} actionData={undefined} />);
    expect(serverMarkup).not.toContain("Can&#x27;t reach DueNow");
  });
});
