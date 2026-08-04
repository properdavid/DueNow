/**
 * The list column's width, as the shell remembers it (ADR-0031).
 *
 * A cookie rather than `localStorage` because the width decides the tree row's
 * *shape*: correcting it after hydration would visibly restack every row. The
 * shell loader reads it, so the server renders the geometry the browser is
 * about to keep. It is per-browser, so the household's two members hold
 * different widths without either of them configuring anything.
 */
import { clampListColumnWidthPx, LIST_COLUMN_DEFAULT_PX } from "~/components/work-items/tree-geometry";

export const LIST_COLUMN_WIDTH_COOKIE = "duenow_list_column_width";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export function listColumnWidthFromCookieHeader(header: string | null | undefined) {
  if (!header) return LIST_COLUMN_DEFAULT_PX;
  const entry = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LIST_COLUMN_WIDTH_COOKIE}=`));
  if (!entry) return LIST_COLUMN_DEFAULT_PX;
  return clampListColumnWidthPx(Number(entry.slice(LIST_COLUMN_WIDTH_COOKIE.length + 1)));
}

export function listColumnWidthCookie(widthPx: number) {
  return `${LIST_COLUMN_WIDTH_COOKIE}=${clampListColumnWidthPx(widthPx)}; Path=/; Max-Age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`;
}
