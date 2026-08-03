import { workItemStatuses, workItemTypes, type WorkItemStatus, type WorkItemType } from "~/db/schema";
import type { SearchDirection, SearchDueFilter, SearchSort, SearchWorkItemsInput } from "~/domain/work-items/work-items.server";

const searchSorts = ["id", "type", "summary", "parent", "assignee", "status", "due", "updated"] as const satisfies readonly SearchSort[];
const searchDirections = ["asc", "desc"] as const satisfies readonly SearchDirection[];

export function searchWorkItemsInputFromUrl(url: URL): SearchWorkItemsInput {
  return {
    keyword: url.searchParams.get("q") ?? url.searchParams.get("keyword") ?? undefined,
    types: enumParams(url, "type", workItemTypes) as WorkItemType[],
    statuses: enumParams(url, "status", workItemStatuses) as WorkItemStatus[],
    assigneeIds: assigneeParams(url),
    parentIds: numberParams(url, "parent"),
    due: dueFilterFromUrl(url),
    labelIds: numberParams(url, "labels").length > 0 ? numberParams(url, "labels") : numberParams(url, "label"),
    sort: enumParam(url, "sort", searchSorts) as SearchSort | undefined,
    direction: (enumParam(url, "dir", searchDirections) ?? enumParam(url, "direction", searchDirections)) as SearchDirection | undefined,
  };
}

function enumParam<T extends string>(url: URL, name: string, allowed: readonly T[]) {
  const value = url.searchParams.get(name);
  return value && (allowed as readonly string[]).includes(value) ? value : undefined;
}

function enumParams<T extends string>(url: URL, name: string, allowed: readonly T[]) {
  return splitParams(url, name).filter((value) => (allowed as readonly string[]).includes(value));
}

function numberParams(url: URL, name: string) {
  return splitParams(url, name)
    .map((value) => Number(value))
    .filter((value) => Number.isSafeInteger(value) && value > 0);
}

function assigneeParams(url: URL) {
  const values = splitParams(url, "who");
  return (values.length > 0 ? values : splitParams(url, "assignee"))
    .map((value) => (value === "unassigned" ? null : Number(value)))
    .filter((value): value is number | null => value === null || (Number.isSafeInteger(value) && value > 0));
}

function splitParams(url: URL, name: string) {
  return url.searchParams
    .getAll(name)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function dueFilterFromUrl(url: URL): SearchDueFilter | undefined {
  const mode = url.searchParams.get("due") ?? "any";
  switch (mode) {
    case "overdue":
    case "none":
      return { mode };
    case "before": {
      const date = url.searchParams.get("from") ?? url.searchParams.get("date");
      return date ? { mode, date } : undefined;
    }
    case "after": {
      const date = url.searchParams.get("from") ?? url.searchParams.get("date");
      return date ? { mode, date } : undefined;
    }
    case "between": {
      const start = url.searchParams.get("from") ?? url.searchParams.get("start");
      const end = url.searchParams.get("to") ?? url.searchParams.get("end");
      return start && end ? { mode, start, end } : undefined;
    }
    default:
      return undefined;
  }
}
