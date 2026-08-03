import type { UpdateWorkItemResult } from "~/domain/work-items/work-items.server";

export function parseWorkItemId(value: string | undefined) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Response("Work Item not found", { status: 404 });
  }
  return id;
}

export function runFieldUpdate(operation: () => UpdateWorkItemResult): UpdateWorkItemResult {
  try {
    return operation();
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    return { ok: false, error: { message: "Try again." } };
  }
}
