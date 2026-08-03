import type { ActionFunctionArgs } from "react-router";

import { getDatabase, requireUser } from "~/auth/session.server";
import { parseLabelId, renameLabel } from "~/domain/settings/settings.server";

export async function action({ request, params, context }: ActionFunctionArgs) {
  await requireUser(request, context);
  const id = parseLabelId(params.id);
  if (id === null) return { ok: false as const, error: { field: "id", message: "Choose a valid Label." } };
  const formData = await request.formData();
  const result = renameLabel(getDatabase(context), id, String(formData.get("name") ?? ""));
  return result;
}
