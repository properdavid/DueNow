export { clientAction } from "~/pwa/unreachable-action";
import type { ActionFunctionArgs } from "react-router";

import { getDatabase, requireUser } from "~/auth/session.server";
import { updateHouseholdTimezone } from "~/domain/settings/settings.server";
import { runFieldUpdate } from "./work-item-field-actions";

export async function action({ request, context }: ActionFunctionArgs) {
  await requireUser(request, context);
  const formData = await request.formData();
  return runFieldUpdate(() => updateHouseholdTimezone(getDatabase(context), String(formData.get("timezone") ?? "")));
}
