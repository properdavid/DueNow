import type { Route } from "./+types/auth.google";
import { createGoogleOAuthStart } from "~/auth/oauth.server";
import { AllowlistRejection, createSession, getDatabase, getEnv, getOrCreateUser, sessionCookie } from "~/auth/session.server";

export function loader({ context }: Route.LoaderArgs) {
  const { url, cookies } = createGoogleOAuthStart(getEnv(context));
  const headers = new Headers({ Location: url.toString() });
  for (const cookie of cookies) {
    headers.append("Set-Cookie", cookie);
  }
  return new Response(null, { status: 302, headers });
}

export async function action({ request, context }: Route.ActionArgs) {
  const env = getEnv(context);
  if (env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const formData = await request.formData();
  const configuredEmail = (env.DUENOW_DEV_AUTH_EMAIL ?? env.DUENOW_ALLOWED_EMAILS?.split(",")[0] ?? "").trim();
  const email = String(formData.get("email") ?? configuredEmail);
  const name = String(formData.get("name") ?? env.DUENOW_DEV_AUTH_NAME ?? email.split("@")[0] ?? "Household member");

  try {
    const database = getDatabase(context);
    const user = await getOrCreateUser(database, { email, name, subject: `dev:${email.toLowerCase()}` }, env);
    const session = createSession(database, user.id);
    return new Response(null, {
      status: 302,
      headers: { Location: "/", "Set-Cookie": sessionCookie(session.id, env) },
    });
  } catch (error) {
    if (error instanceof AllowlistRejection) {
      return new Response(null, { status: 302, headers: { Location: `/login?email=${encodeURIComponent(error.email)}` } });
    }
    throw error;
  }
}
