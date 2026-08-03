import type { Route } from "./+types/api.work-items.$id.reparent";
import { getDatabase, requireUser } from "~/auth/session.server";
import { reparentWorkItem } from "~/domain/work-items/work-items.server";

export async function action({ request, params, context }: Route.ActionArgs) {
  const user = await requireUser(request, context);
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Response("Work Item not found", { status: 404 });
  }

  const formData = await request.formData();
  const parentId = positiveInteger(formData.get("parentId"));
  if (parentId === null) {
    return { ok: false as const, error: { field: "parentId", message: "Choose a valid Parent." } };
  }

  return reparentWorkItem(getDatabase(context), id, parentId, formData.get("confirmed") === "true", user.id);
}

function positiveInteger(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
