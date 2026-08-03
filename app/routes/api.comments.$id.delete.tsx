import type { ActionFunctionArgs } from "react-router";

import { getDatabase, requireUser } from "~/auth/session.server";
import { deleteComment } from "~/domain/work-items/work-items.server";
import { parseCommentId, runFieldUpdate } from "./work-item-field-actions";

export async function action({ request, params, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  return runFieldUpdate(() => deleteComment(getDatabase(context), parseCommentId(params.id), user.id));
}
