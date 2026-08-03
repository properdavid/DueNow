import type { ActionFunctionArgs } from "react-router";

import { getDatabase, requireUser } from "~/auth/session.server";
import { createLabel } from "~/domain/settings/settings.server";

export async function action({ request, context }: ActionFunctionArgs) {
  await requireUser(request, context);
  const formData = await request.formData();
  const result = createLabel(getDatabase(context), String(formData.get("name") ?? ""));
  return result;
}
