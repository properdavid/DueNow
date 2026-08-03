import type { UpdateWorkItemResult, UpdateWorkItemStatusResult } from "~/domain/work-items/work-items.server";

export function parseWorkItemId(value: string | undefined) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Response("Work Item not found", { status: 404 });
  }
  return id;
}

export function parsePositiveFormInteger(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : "invalid";
}

export function runFieldUpdate<T extends UpdateWorkItemResult | UpdateWorkItemStatusResult>(operation: () => T): T | UpdateWorkItemResult {
  try {
    return operation();
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    return { ok: false, error: { message: "Try again." } };
  }
}
