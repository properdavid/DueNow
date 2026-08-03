import { redirect } from "react-router";

import type { Route } from "./+types/auth.google-callback";
import { expiredOAuthCookies, validateGoogleCallback } from "~/auth/oauth.server";
import { AllowlistRejection, createSession, getDatabase, getEnv, getOrCreateUser, sessionCookie } from "~/auth/session.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const database = getDatabase(context);
  const headers = new Headers();
  for (const cookie of expiredOAuthCookies(env)) {
    headers.append("Set-Cookie", cookie);
  }

  try {
    const claims = await validateGoogleCallback(request, env);
    const user = await getOrCreateUser(database, claims, env);
    const session = createSession(database, user.id);
    headers.append("Set-Cookie", sessionCookie(session.id, env));
    return redirect("/", { headers });
  } catch (error) {
    if (error instanceof AllowlistRejection) {
      return redirect(`/login?email=${encodeURIComponent(error.email)}`, { headers });
    }
    throw error;
  }
}
