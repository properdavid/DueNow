import type { ActionFunctionArgs } from "react-router";

import { getDatabase, requireUser } from "~/auth/session.server";
import { updateWorkItemDueDate } from "~/domain/work-items/work-items.server";
import { parseWorkItemId, runFieldUpdate } from "./work-item-field-actions";

export async function action({ request, params, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  const id = parseWorkItemId(params.id);
  const formData = await request.formData();
  return runFieldUpdate(() => updateWorkItemDueDate(getDatabase(context), id, nullableString(formData, "dueDate"), user.id));
}

function nullableString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length === 0 ? null : value;
}
