export { clientAction } from "~/pwa/unreachable-action";
import type { Route } from "./+types/api.work-items.create";
import { getDatabase, requireUser } from "~/auth/session.server";
import { createWorkItem } from "~/domain/work-items/work-items.server";
import { workItemStatuses, workItemTypes, type WorkItemStatus, type WorkItemType } from "~/db/schema";
import { runFieldUpdate } from "./work-item-field-actions";

export async function action({ request, context }: Route.ActionArgs) {
  const user = await requireUser(request, context);
  const formData = await request.formData();
  const type = stringValue(formData, "type");
  const status = stringValue(formData, "status") || "open";

  if (!isWorkItemType(type)) {
    return { ok: false as const, error: { field: "type", message: "Choose a valid Type." } };
  }
  if (!isWorkItemStatus(status)) {
    return { ok: false as const, error: { field: "status", message: "Choose a valid Status." } };
  }

  return runFieldUpdate(() =>
    createWorkItem(
      getDatabase(context),
      {
        type,
        summary: stringValue(formData, "summary"),
        parentId: nullablePositiveInteger(formData, "parentId"),
        description: stringValue(formData, "description"),
        dueDate: nullableString(formData, "dueDate"),
        status,
        assigneeId: nullablePositiveInteger(formData, "assigneeId"),
        labelIds: formData.getAll("labelIds").map(String).map(Number).filter((id) => Number.isSafeInteger(id) && id > 0),
      },
      user.id,
    ),
  );
}

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function nullableString(formData: FormData, key: string) {
  const value = stringValue(formData, key).trim();
  return value.length === 0 ? null : value;
}

function nullablePositiveInteger(formData: FormData, key: string) {
  const value = nullableString(formData, key);
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function isWorkItemType(value: string): value is WorkItemType {
  return workItemTypes.some((type) => type === value);
}

function isWorkItemStatus(value: string): value is WorkItemStatus {
  return workItemStatuses.some((status) => status === value);
}
