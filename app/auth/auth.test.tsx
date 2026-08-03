import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";

import { createRouteTestHarness } from "~/test/route-harness";
import { getOrCreateUser } from "./session.server";
import * as googleRoute from "~/routes/auth.google";
import * as loginRoute from "~/routes/login";
import * as logoutRoute from "~/routes/auth.logout";
import * as shellRoute from "~/routes/shell";

describe("auth at the route seam", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("a non-allowlisted email is rejected before a user row exists", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      await expect(
        getOrCreateUser(harness.database, {
          email: "stranger@example.com",
          name: "Stranger",
          subject: "google-subject",
        }),
      ).rejects.toMatchObject({ email: "stranger@example.com" });
      expect(harness.database.sqlite.prepare("SELECT COUNT(*) AS count FROM users").get()).toEqual({ count: 0 });
    } finally {
      harness.close();
    }
  });

  test("successful sign-in lazily creates a user and refreshes name and email on the next sign-in", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const first = await getOrCreateUser(harness.database, {
        email: "dana@example.com",
        name: "Dana Old",
        subject: "google-subject",
      });
      const second = await getOrCreateUser(harness.database, {
        email: "DANA@example.com",
        name: "Dana New",
        subject: "google-subject",
      });

      expect(second.id).toBe(first.id);
      expect(harness.database.sqlite.prepare("SELECT email, name FROM users").all()).toEqual([
        { email: "DANA@example.com", name: "Dana New" },
      ]);
      expect(harness.database.sqlite.prepare("PRAGMA table_info(users)").all()).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ name: "picture" })]),
      );
    } finally {
      harness.close();
    }
  });

  test("dev auth signs in without Google outside production and remains allowlist-checked", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com", NODE_ENV: "development" } });

    try {
      const response = await harness.runAction<Response>(googleRoute.action, "/auth/google", {
        method: "POST",
        formData: { email: "dana@example.com", name: "Dana" },
      });

      expect(response.status).toBe(302);
      expect(response.headers.get("Set-Cookie")).toContain("sid=");
      expect(response.headers.get("Set-Cookie")).toContain("HttpOnly");
      expect(harness.database.sqlite.prepare("SELECT email, name FROM users").all()).toEqual([
        { email: "dana@example.com", name: "Dana" },
      ]);
    } finally {
      harness.close();
    }
  });

  test("dev auth is unreachable in production", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com", NODE_ENV: "production" } });

    try {
      const response = await harness.runAction<Response>(googleRoute.action, "/auth/google", {
        method: "POST",
        formData: { email: "dana@example.com", name: "Dana" },
      });

      expect(response.status).toBe(404);
      expect(harness.database.sqlite.prepare("SELECT COUNT(*) AS count FROM users").get()).toEqual({ count: 0 });
    } finally {
      harness.close();
    }
  });

  test("dev auth rejects a non-allowlisted email through the route seam before creating a user row", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com", NODE_ENV: "development" } });

    try {
      const response = await harness.runAction<Response>(googleRoute.action, "/auth/google", {
        method: "POST",
        formData: { email: "stranger@example.com", name: "Stranger" },
      });

      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/login?email=stranger%40example.com");
      expect(harness.database.sqlite.prepare("SELECT COUNT(*) AS count FROM users").get()).toEqual({ count: 0 });
    } finally {
      harness.close();
    }
  });

  test("requireUser redirects an unauthenticated protected loader", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const response = await harness.runLoader<Response>(shellRoute.loader, "/due");

      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/login");
    } finally {
      harness.close();
    }
  });

  test("sign-out destroys the session and expires the sid cookie", async () => {
    const harness = createRouteTestHarness({ env: { DUENOW_ALLOWED_EMAILS: "dana@example.com" } });

    try {
      const cookie = await harness.authenticatedCookie({ email: "dana@example.com", name: "Dana" });
      const response = await harness.runAction<Response>(logoutRoute.action, "/auth/logout", {
        method: "POST",
        headers: { Cookie: cookie },
      });

      expect(response.status).toBe(302);
      expect(response.headers.get("Set-Cookie")).toContain("sid=;");
      expect(response.headers.get("Set-Cookie")).toContain("Max-Age=0");
      expect(harness.database.sqlite.prepare("SELECT COUNT(*) AS count FROM sessions").get()).toEqual({ count: 0 });
    } finally {
      harness.close();
    }
  });

  test("the sign-in and rejection cards use the same single-control door copy", () => {
    const Login = loginRoute.default as (props: {
      loaderData: { attemptedEmail: string | null; devAuthAvailable: boolean };
    }) => React.ReactNode;
    const signInMarkup = renderToStaticMarkup(Login({ loaderData: { attemptedEmail: null, devAuthAvailable: false } }));
    const rejectionMarkup = renderToStaticMarkup(
      Login({ loaderData: { attemptedEmail: "stranger@example.com", devAuthAvailable: false } }),
    );

    expect(signInMarkup).toContain("DueNow");
    expect(signInMarkup).toContain("Your household’s work, in one place");
    expect(signInMarkup).toContain("Continue with Google");
    expect(signInMarkup).toContain("Only accounts set up for this household can sign in.");
    expect(signInMarkup).not.toMatch(/list|instance|configuration/i);
    expect(rejectionMarkup).toContain("You can&#x27;t sign in here");
    expect(rejectionMarkup).toContain("stranger@example.com");
    expect(rejectionMarkup).toContain("Try another account");
    expect(rejectionMarkup).not.toMatch(/Continue with Google|list|instance|configuration/i);
  });
});
