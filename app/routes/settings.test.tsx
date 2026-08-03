import { renderToStaticMarkup } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { describe, expect, test, vi } from "vitest";

import { createRouteTestHarness } from "~/test/route-harness";
import { loadDueRadar } from "~/domain/work-items/work-items.server";
import * as createLabelRoute from "./api.labels.create";
import * as deleteLabelRoute from "./api.labels.$id.delete";
import * as renameLabelRoute from "./api.labels.$id.rename";
import * as themeRoute from "./api.settings.theme";
import * as timezoneRoute from "./api.settings.timezone";
import * as settingsRoute from "./settings";

describe("Settings route seam", () => {
  test("the loader returns Label usage counts while shell owns Settings reference data", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com,lee@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const dana = harness.database.sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };
      harness.database.sqlite
        .prepare("INSERT INTO users (googleSubject, email, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)")
        .run("lee", "lee@example.com", "Lee", 1, 1);
      const label = harness.database.sqlite
        .prepare("INSERT INTO labels (name, createdAt, updatedAt) VALUES (?, ?, ?) RETURNING id")
        .get("House", 1, 1) as { id: number };
      harness.database.sqlite
        .prepare("INSERT INTO work_items (id, type, summary, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(1, "topic", "Kitchen", 1, 1, dana.id, dana.id);
      harness.database.sqlite.prepare("INSERT INTO work_item_labels (workItemId, labelId) VALUES (?, ?)").run(1, label.id);
      harness.database.sqlite.prepare("UPDATE household_settings SET timezone = ? WHERE id = 1").run("America/Los_Angeles");

      const data = await harness.runLoader<ReturnType<typeof settingsRoute.loader>>(settingsRoute.loader, "/settings", {
        headers: { Cookie: cookie },
      });

      if (data instanceof Response) throw new Error("Expected settings loader data.");
      expect(data).toMatchObject({
        labelUsageCounts: [{ labelId: label.id, usageCount: 1 }],
        timezones: expect.arrayContaining(["America/Los_Angeles"]),
      });
      expect(data).not.toHaveProperty("members");
      expect(data).not.toHaveProperty("householdTimezone");
    } finally {
      harness.close();
    }
  });

  test("theme changes by authenticated form submission and rejects invalid themes", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });

      const result = await harness.runAction<ReturnType<typeof themeRoute.action>>(themeRoute.action, "/api/settings/theme", {
        headers: { Cookie: cookie },
        formData: { theme: "dark" },
      });

      expect(result).toEqual({ ok: true });
      expect(harness.database.sqlite.prepare("SELECT theme FROM users WHERE email = ?").get("dana@example.com")).toMatchObject({ theme: "dark" });

      const invalid = await harness.runAction<ReturnType<typeof themeRoute.action>>(themeRoute.action, "/api/settings/theme", {
        headers: { Cookie: cookie },
        formData: { theme: "sepia" },
      });
      expect(invalid).toEqual({ ok: false, error: { field: "theme", message: "Choose System, Light or Dark." } });
    } finally {
      harness.close();
    }
  });

  test("timezone changes move Due tab boundaries for the household", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-03T06:30:00.000Z"));
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const dana = harness.database.sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };
      harness.database.sqlite
        .prepare("INSERT INTO work_items (id, type, summary, status, dueDate, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(1, "topic", "Pay rent", "open", "2026-08-02", 1, 1, dana.id, dana.id);

      const result = await harness.runAction<ReturnType<typeof timezoneRoute.action>>(timezoneRoute.action, "/api/settings/timezone", {
        headers: { Cookie: cookie },
        formData: { timezone: "America/Los_Angeles" },
      });

      expect(result).toEqual({ ok: true });
      expect(loadDueRadar(harness.database, dana.id, "everyone", new Date()).today).toBe("2026-08-02");
      expect(loadDueRadar(harness.database, dana.id, "everyone", new Date()).groups.now[0]).toMatchObject({ summary: "Pay rent", relativeDate: "Today" });
    } finally {
      vi.useRealTimers();
      harness.close();
    }
  });

  test("Label management trims, enforces case-insensitive uniqueness, renames by id, and deletes in-use Labels", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const dana = harness.database.sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };

      const created = await harness.runAction<ReturnType<typeof createLabelRoute.action>>(createLabelRoute.action, "/api/labels/create", {
        headers: { Cookie: cookie },
        formData: { name: " Groceries " },
      });
      expect(created).toEqual({ ok: true });
      const label = harness.database.sqlite.prepare("SELECT id, name FROM labels").get() as { id: number; name: string };
      expect(label.name).toBe("Groceries");

      const duplicate = await harness.runAction<ReturnType<typeof createLabelRoute.action>>(createLabelRoute.action, "/api/labels/create", {
        headers: { Cookie: cookie },
        formData: { name: "groceries" },
      });
      expect(duplicate).toEqual({ ok: false, error: { field: "name", message: "A Label with that name already exists." } });

      const renamed = await harness.runAction<ReturnType<typeof renameLabelRoute.action>>(renameLabelRoute.action, `/api/labels/${label.id}/rename`, {
        headers: { Cookie: cookie },
        formData: { name: " Errands " },
        params: { id: String(label.id) },
      });
      expect(renamed).toEqual({ ok: true });
      expect(harness.database.sqlite.prepare("SELECT name FROM labels WHERE id = ?").get(label.id)).toMatchObject({ name: "Errands" });

      harness.database.sqlite
        .prepare("INSERT INTO work_items (id, type, summary, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(1, "topic", "Kitchen", 1, 1, dana.id, dana.id);
      harness.database.sqlite.prepare("INSERT INTO work_item_labels (workItemId, labelId) VALUES (?, ?)").run(1, label.id);

      const deleted = await harness.runAction<ReturnType<typeof deleteLabelRoute.action>>(deleteLabelRoute.action, `/api/labels/${label.id}/delete`, {
        headers: { Cookie: cookie },
        formData: {},
        params: { id: String(label.id) },
      });
      expect(deleted).toEqual({ ok: true });
      expect(harness.database.sqlite.prepare("SELECT COUNT(*) AS count FROM labels").get()).toEqual({ count: 0 });
      expect(harness.database.sqlite.prepare("SELECT COUNT(*) AS count FROM work_item_labels").get()).toEqual({ count: 0 });
    } finally {
      harness.close();
    }
  });

  test("the page renders You and Household sections without ruled-out settings", () => {
    const shellData = {
      user: { id: 1, email: "dana@example.com", name: "Dana", theme: "dark" as const },
      members: [
        { id: 1, email: "dana@example.com", name: "Dana", theme: "dark" as const },
        { id: 2, email: "lee@example.com", name: "Lee", theme: "system" as const },
      ],
      householdTimezone: { timezone: "America/Los_Angeles" },
      labels: [
        { id: 1, name: "House" },
        { id: 2, name: "Errands" },
      ],
    };
    const loaderData = {
      labelUsageCounts: [{ labelId: 1, usageCount: 2 }],
      timezones: ["America/Los_Angeles", "UTC"],
    };
    const Stub = createRoutesStub([
      {
        path: "/settings",
        Component: () => <settingsRoute.SettingsPage loaderData={loaderData} shellData={shellData} />,
      },
    ]);

    const markup = renderToStaticMarkup(<Stub initialEntries={["/settings"]} />);

    expect(markup).toContain("You");
    expect(markup).toContain("Theme");
    expect(markup).toContain("Sign out");
    expect(markup).toContain("Household");
    expect(markup).toContain("Household Timezone");
    expect(markup).toContain("Dana");
    expect(markup).toContain("lee@example.com");
    expect(markup).toContain("House");
    expect(markup).toContain("2 Work Items");
    expect(markup).toContain("Deleting detaches this Label everywhere.");
    expect(markup).toContain("maxLength=\"30\"");
    expect(markup).not.toContain("Default Assignee");
    expect(markup).not.toContain("allowlist");
    expect(markup).not.toContain("Danger zone");
  });
});
