import type { ActionFunctionArgs } from "react-router";

import { getDatabase, requireUser } from "~/auth/session.server";
import { updateWorkItemDescription } from "~/domain/work-items/work-items.server";
import { parseWorkItemId, runFieldUpdate } from "./work-item-field-actions";

export async function action({ request, params, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  const id = parseWorkItemId(params.id);
  const formData = await request.formData();
  return runFieldUpdate(() => updateWorkItemDescription(getDatabase(context), id, String(formData.get("description") ?? ""), user.id));
}
