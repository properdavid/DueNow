export { clientAction } from "~/pwa/unreachable-action";
import type { Route } from "./+types/api.work-items.$id.unsettle";
import { getDatabase, requireUser } from "~/auth/session.server";
import { reopenAndUnsettleWorkItem, unsettleWorkItem } from "~/domain/work-items/work-items.server";
import { parseWorkItemId, runFieldUpdate } from "./work-item-field-actions";

export async function action({ request, params, context }: Route.ActionArgs) {
  const user = await requireUser(request, context);
  const formData = await request.formData();
  const id = parseWorkItemId(params.id);
  return runFieldUpdate(() =>
    formData.get("confirmed") === "true" ? reopenAndUnsettleWorkItem(getDatabase(context), id, user.id) : unsettleWorkItem(getDatabase(context), id, user.id),
  );
}
