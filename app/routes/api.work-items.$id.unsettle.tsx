import type { Route } from "./+types/api.work-items.$id.unsettle";
import { getDatabase, requireUser } from "~/auth/session.server";
import { unsettleWorkItem } from "~/domain/work-items/work-items.server";
import { parseWorkItemId, runFieldUpdate } from "./work-item-field-actions";

export async function action({ request, params, context }: Route.ActionArgs) {
  const user = await requireUser(request, context);
  return runFieldUpdate(() => unsettleWorkItem(getDatabase(context), parseWorkItemId(params.id), user.id));
}
