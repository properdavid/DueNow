import { redirect } from "react-router";

import type { Route } from "./+types/api.work-items.$id.start";
import { getDatabase, requireUser } from "~/auth/session.server";
import { startWorkItem } from "~/domain/work-items/work-items.server";

export async function action({ request, params, context }: Route.ActionArgs) {
  const user = await requireUser(request, context);
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Response("Work Item not found", { status: 404 });
  }

  startWorkItem(getDatabase(context), id, user.id);
  const returnTo = new URL(request.url).searchParams.get("returnTo");
  return redirect(returnTo && returnTo.startsWith("/items") ? returnTo : "/items");
}
