import type { ActionFunction, LoaderFunction } from "react-router";

import { createPersistenceTestHarness } from "~/db/test-harness";
import { createSession, getOrCreateUser, sessionCookie, type GoogleIdentityClaims } from "~/auth/session.server";

interface RouteHarnessOptions {
  env?: Record<string, string | undefined>;
}

interface RequestOptions {
  method?: string;
  headers?: HeadersInit;
  formData?: Record<string, string>;
  params?: Record<string, string>;
}

export function createRouteTestHarness(options: RouteHarnessOptions = {}) {
  const previousEnv = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(options.env ?? {})) {
    previousEnv.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  const database = createPersistenceTestHarness();
  const env = { ...process.env, ...options.env };
  const context = { database, env };

  function buildRequest(path: string, requestOptions: RequestOptions = {}) {
    const body = requestOptions.formData ? new URLSearchParams(requestOptions.formData) : undefined;
    const headers = new Headers(requestOptions.headers);
    if (body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/x-www-form-urlencoded");
    }
    return new Request(new URL(path, "http://duenow.test"), {
      method: requestOptions.method ?? (body ? "POST" : "GET"),
      headers,
      body,
    });
  }

  async function runRoute<T>(
    routeFunction: (args: { request: Request; params: Record<string, string>; context: typeof context }) => T | Promise<T>,
    path: string,
    requestOptions?: RequestOptions,
  ): Promise<Awaited<T> | Response> {
    try {
      return await routeFunction({
        request: buildRequest(path, requestOptions),
        params: requestOptions?.params ?? {},
        context,
      });
    } catch (error) {
      if (error instanceof Response) return error;
      throw error;
    }
  }

  return {
    database,
    env,
    request: buildRequest,
    runLoader: <T>(loader: LoaderFunction, path: string, requestOptions?: RequestOptions) =>
      runRoute<T>(loader as Parameters<typeof runRoute<T>>[0], path, requestOptions),
    runAction: <T>(action: ActionFunction, path: string, requestOptions?: RequestOptions) =>
      runRoute<T>(action as Parameters<typeof runRoute<T>>[0], path, requestOptions),
    async authenticatedCookie(claims: Omit<GoogleIdentityClaims, "subject"> & { subject?: string }) {
      const user = await getOrCreateUser(database, { subject: "test-subject", ...claims }, env);
      const session = createSession(database, user.id);
      return sessionCookie(session.id, env);
    },
    close() {
      database.close();
      for (const [key, value] of previousEnv) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    },
  };
}
