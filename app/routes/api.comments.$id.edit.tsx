import type { ActionFunctionArgs } from "react-router";

import { getDatabase, requireUser } from "~/auth/session.server";
import { editComment } from "~/domain/work-items/work-items.server";
import { parseCommentId, runFieldUpdate } from "./work-item-field-actions";

export async function action({ request, params, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  const id = parseCommentId(params.id);
  const formData = await request.formData();
  return runFieldUpdate(() => editComment(getDatabase(context), id, String(formData.get("body") ?? ""), user.id));
}
