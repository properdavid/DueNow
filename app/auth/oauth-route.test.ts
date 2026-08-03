import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("arctic", () => {
  class Google {
    createAuthorizationURL(state: string, codeVerifier: string) {
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.searchParams.set("state", state);
      url.searchParams.set("code_challenge", codeVerifier);
      return url;
    }

    validateAuthorizationCode() {
      return Promise.resolve({ idToken: () => "id-token" });
    }
  }

  return {
    Google,
    generateState: () => "state-from-arctic",
    generateCodeVerifier: () => "pkce-from-arctic",
    decodeIdToken: () => ({ email: "dana@example.com", name: "Dana", sub: "google-subject", picture: "ignored" }),
  };
});

import { createRouteTestHarness } from "~/test/route-harness";
import * as googleRoute from "~/routes/auth.google";
import * as callbackRoute from "~/routes/auth.google-callback";

describe("Google OAuth routes", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  test("Google OAuth signs a household member in and sets an httpOnly sid cookie", async () => {
    const harness = createRouteTestHarness({
      env: {
        DUENOW_ALLOWED_EMAILS: "dana@example.com",
        GOOGLE_CLIENT_ID: "client-id",
        GOOGLE_CLIENT_SECRET: "client-secret",
        GOOGLE_REDIRECT_URI: "http://duenow.test/auth/google/callback",
      },
    });

    try {
      const start = await harness.runLoader<Response>(googleRoute.loader, "/auth/google");
      expect(start.status).toBe(302);
      expect(start.headers.get("Location")).toContain("state=state-from-arctic");
      expect(start.headers.get("Set-Cookie")).toContain("oauth_state=state-from-arctic");
      expect(start.headers.get("Set-Cookie")).toContain("oauth_pkce=pkce-from-arctic");

      const callback = await harness.runLoader<Response>(
        callbackRoute.loader,
        "/auth/google/callback?state=state-from-arctic&code=google-code",
        { headers: { Cookie: "oauth_state=state-from-arctic; oauth_pkce=pkce-from-arctic" } },
      );

      expect(callback.status).toBe(302);
      expect(callback.headers.get("Set-Cookie")).toContain("sid=");
      expect(callback.headers.get("Set-Cookie")).toContain("HttpOnly");
      expect(harness.database.sqlite.prepare("SELECT email, name FROM users").all()).toEqual([
        { email: "dana@example.com", name: "Dana" },
      ]);
    } finally {
      harness.close();
    }
  });
});
