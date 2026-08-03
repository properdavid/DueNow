import type { ActionFunctionArgs } from "react-router";

import { getDatabase, requireUser } from "~/auth/session.server";
import { updateWorkItemAssignee } from "~/domain/work-items/work-items.server";
import { parseWorkItemId, runFieldUpdate } from "./work-item-field-actions";

export async function action({ request, params, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  const id = parseWorkItemId(params.id);
  const formData = await request.formData();
  const assigneeId = parseNullablePositiveInteger(formData, "assigneeId");
  if (assigneeId === "invalid") {
    return { ok: false as const, error: { field: "assigneeId", message: "Choose a valid Assignee." } };
  }
  return runFieldUpdate(() => updateWorkItemAssignee(getDatabase(context), id, assigneeId, user.id));
}

function parseNullablePositiveInteger(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (value.length === 0) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : "invalid";
}
