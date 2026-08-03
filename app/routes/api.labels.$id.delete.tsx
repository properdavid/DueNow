export { clientAction } from "~/pwa/unreachable-action";
import type { ActionFunctionArgs } from "react-router";

import { getDatabase, requireUser } from "~/auth/session.server";
import { deleteLabel, parseLabelId } from "~/domain/settings/settings.server";
import { runFieldUpdate } from "./work-item-field-actions";

export async function action({ request, params, context }: ActionFunctionArgs) {
  await requireUser(request, context);
  const id = parseLabelId(params.id);
  if (id === null) return { ok: false as const, error: { field: "id", message: "Choose a valid Label." } };
  return runFieldUpdate(() => deleteLabel(getDatabase(context), id));
}
