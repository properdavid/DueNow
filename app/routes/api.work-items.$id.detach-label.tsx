export { clientAction } from "~/pwa/unreachable-action";
import type { ActionFunctionArgs } from "react-router";

import { getDatabase, requireUser } from "~/auth/session.server";
import { detachLabelFromWorkItem } from "~/domain/work-items/work-items.server";
import { parsePositiveFormInteger, parseWorkItemId, runFieldUpdate } from "./work-item-field-actions";

export async function action({ request, params, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  const id = parseWorkItemId(params.id);
  const formData = await request.formData();
  const labelId = parsePositiveFormInteger(formData, "labelId");
  if (labelId === "invalid") {
    return { ok: false as const, error: { field: "labelId", message: "Choose a valid Label." } };
  }
  return runFieldUpdate(() => detachLabelFromWorkItem(getDatabase(context), id, labelId, user.id));
}
