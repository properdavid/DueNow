import { redirect } from "react-router";

import type { Route } from "./+types/auth.logout";
import { destroySession, expiredSessionCookie, getDatabase, getEnv, readSessionCookie, requireUser } from "~/auth/session.server";

export async function action({ request, context }: Route.ActionArgs) {
  const env = getEnv(context);
  await requireUser(request, context);
  destroySession(getDatabase(context), readSessionCookie(request));
  return redirect("/login", { headers: { "Set-Cookie": expiredSessionCookie(env) } });
}
