import { describe, expect, test } from "vitest";

import {
  LIST_COLUMN_WIDTH_COOKIE,
  listColumnWidthCookie,
  listColumnWidthFromCookieHeader,
} from "./list-column-width";
import {
  LIST_COLUMN_CEILING_PX,
  LIST_COLUMN_DEFAULT_PX,
  LIST_COLUMN_FLOOR_PX,
} from "~/components/work-items/tree-geometry";

describe("the remembered list column width", () => {
  test("reads a width the browser has kept", () => {
    expect(listColumnWidthFromCookieHeader(`${LIST_COLUMN_WIDTH_COOKIE}=600`)).toBe(600);
    expect(listColumnWidthFromCookieHeader(`theme=dark; ${LIST_COLUMN_WIDTH_COOKIE}=600; other=1`)).toBe(600);
  });

  test("opens at the default when nothing has been kept", () => {
    expect(listColumnWidthFromCookieHeader(null)).toBe(LIST_COLUMN_DEFAULT_PX);
    expect(listColumnWidthFromCookieHeader("theme=dark")).toBe(LIST_COLUMN_DEFAULT_PX);
  });

  /* A cookie is user-editable and outlives the geometry that produced it, so it
     is a claim about the width rather than the width itself. */
  test("holds anything outside the range to the range", () => {
    expect(listColumnWidthFromCookieHeader(`${LIST_COLUMN_WIDTH_COOKIE}=90`)).toBe(LIST_COLUMN_FLOOR_PX);
    expect(listColumnWidthFromCookieHeader(`${LIST_COLUMN_WIDTH_COOKIE}=4000`)).toBe(LIST_COLUMN_CEILING_PX);
    expect(listColumnWidthFromCookieHeader(`${LIST_COLUMN_WIDTH_COOKIE}=wide`)).toBe(LIST_COLUMN_DEFAULT_PX);
  });

  test("writes one long-lived cookie for the whole shell", () => {
    const cookie = listColumnWidthCookie(600);
    expect(cookie).toContain(`${LIST_COLUMN_WIDTH_COOKIE}=600`);
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("SameSite=Lax");
    expect(listColumnWidthCookie(4000)).toContain(`${LIST_COLUMN_WIDTH_COOKIE}=${LIST_COLUMN_CEILING_PX}`);
  });
});
