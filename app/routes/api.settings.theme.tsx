export { clientAction } from "~/pwa/unreachable-action";
import type { ActionFunctionArgs } from "react-router";

import { getDatabase, requireUser } from "~/auth/session.server";
import { updateUserTheme } from "~/domain/settings/settings.server";
import { runFieldUpdate } from "./work-item-field-actions";

export async function action({ request, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  const formData = await request.formData();
  return runFieldUpdate(() => updateUserTheme(getDatabase(context), user.id, String(formData.get("theme") ?? "")));
}
