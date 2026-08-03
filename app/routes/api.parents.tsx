import type { Route } from "./+types/api.parents";
import { getDatabase, requireUser } from "~/auth/session.server";
import { loadParentCandidates } from "~/domain/work-items/work-items.server";
import { workItemTypes, type WorkItemType } from "~/db/schema";

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireUser(request, context);
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  if (!isWorkItemType(type)) {
    return { ok: false as const, error: { field: "type", message: "Choose a valid Type." }, candidates: [] };
  }

  return {
    ok: true as const,
    type,
    query: url.searchParams.get("q") ?? "",
    candidates: loadParentCandidates(getDatabase(context), type, url.searchParams.get("q") ?? "", positiveInteger(url.searchParams.get("excludeParentId"))),
  };
}

function isWorkItemType(value: string | null): value is WorkItemType {
  return workItemTypes.some((type) => type === value);
}

function positiveInteger(value: string | null) {
  if (value === null || value.trim().length === 0) {
    return null;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
