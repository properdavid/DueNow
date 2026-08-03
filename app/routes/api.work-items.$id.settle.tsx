import type { Route } from "./+types/api.work-items.$id.settle";
import { getDatabase, requireUser } from "~/auth/session.server";
import { workItemStatuses, type WorkItemStatus } from "~/db/schema";
import { settleWorkItem } from "~/domain/work-items/work-items.server";
import { parseWorkItemId, runFieldUpdate } from "./work-item-field-actions";

export async function action({ request, params, context }: Route.ActionArgs) {
  const user = await requireUser(request, context);
  const formData = await request.formData();
  const id = parseWorkItemId(params.id);
  const status = String(formData.get("status") ?? "");

  if (!isWorkItemStatus(status) || (status !== "completed" && status !== "closed")) {
    return { ok: false as const, error: { field: "status", message: "Choose Completed or Closed to settle." } };
  }

  return runFieldUpdate(() => settleWorkItem(getDatabase(context), id, status, formData.get("confirmed") === "true", user.id));
}

function isWorkItemStatus(value: string): value is WorkItemStatus {
  return workItemStatuses.some((status) => status === value);
}
