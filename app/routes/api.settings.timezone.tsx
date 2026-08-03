import type { ActionFunctionArgs } from "react-router";

import { getDatabase, requireUser } from "~/auth/session.server";
import { updateHouseholdTimezone } from "~/domain/settings/settings.server";

export async function action({ request, context }: ActionFunctionArgs) {
  await requireUser(request, context);
  const formData = await request.formData();
  const result = updateHouseholdTimezone(getDatabase(context), String(formData.get("timezone") ?? ""));
  return result;
}
