import type { ActionFunctionArgs } from "react-router";

import { getDatabase, requireUser } from "~/auth/session.server";
import { updateUserTheme } from "~/domain/settings/settings.server";

export async function action({ request, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  const formData = await request.formData();
  const result = updateUserTheme(getDatabase(context), user.id, String(formData.get("theme") ?? ""));
  return result;
}
