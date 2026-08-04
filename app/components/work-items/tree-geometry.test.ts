import { describe, expect, test } from "vitest";

import {
  clampListColumnWidthPx,
  DEEPEST_LEVEL,
  DUE_DATE_SLOT_PX,
  LIST_COLUMN_CEILING_PX,
  LIST_COLUMN_DEFAULT_PX,
  LIST_COLUMN_FLOOR_PX,
  LIST_COLUMN_STACK_THRESHOLD_PX,
  SUMMARY_BUDGET_PX,
  summaryWidthPx,
  treeRowIndentPx,
  treeRowShapeFor,
} from "./tree-geometry";

/* Every assertion here is in pixels. A character assertion would convert through
   the same glyph width the budget is derived from and so would prove its own
   input (ADR-0031). */

describe("the Summary budget", () => {
  test("is twenty-four characters of measured Inter, stated in pixels", () => {
    expect(SUMMARY_BUDGET_PX).toBe(170);
  });

  test("survives at the deepest rung at every width the column can take", () => {
    for (let width = LIST_COLUMN_FLOOR_PX; width <= LIST_COLUMN_CEILING_PX; width += 1) {
      expect(summaryWidthPx(width, DEEPEST_LEVEL)).toBeGreaterThanOrEqual(SUMMARY_BUDGET_PX);
    }
  });

  test("survives at every rung, not only the deepest", () => {
    for (let level = 0; level <= DEEPEST_LEVEL; level += 1) {
      expect(summaryWidthPx(LIST_COLUMN_FLOOR_PX, level)).toBeGreaterThanOrEqual(SUMMARY_BUDGET_PX);
      expect(summaryWidthPx(LIST_COLUMN_STACK_THRESHOLD_PX, level)).toBeGreaterThanOrEqual(SUMMARY_BUDGET_PX);
    }
  });

  test("is spent exactly at the floor and at the threshold, so neither is defended by slack", () => {
    expect(summaryWidthPx(LIST_COLUMN_FLOOR_PX, DEEPEST_LEVEL)).toBe(SUMMARY_BUDGET_PX);
    expect(summaryWidthPx(LIST_COLUMN_STACK_THRESHOLD_PX, DEEPEST_LEVEL)).toBe(SUMMARY_BUDGET_PX);
  });
});

describe("the stack threshold", () => {
  test("is the narrowest column the one-line row fits the deepest rung into", () => {
    expect(treeRowShapeFor(LIST_COLUMN_STACK_THRESHOLD_PX)).toBe("one-line");
    expect(treeRowShapeFor(LIST_COLUMN_STACK_THRESHOLD_PX - 1)).toBe("stacked");
  });

  test("buys the deepest rung its budget back by shedding the row's metadata", () => {
    expect(summaryWidthPx(LIST_COLUMN_STACK_THRESHOLD_PX - 1, DEEPEST_LEVEL)).toBeGreaterThan(
      SUMMARY_BUDGET_PX,
    );
  });
});

describe("the column's range", () => {
  test("runs floor to ceiling and opens on the one-line row", () => {
    expect(LIST_COLUMN_FLOOR_PX).toBeLessThan(LIST_COLUMN_DEFAULT_PX);
    expect(LIST_COLUMN_DEFAULT_PX).toBeLessThan(LIST_COLUMN_CEILING_PX);
    expect(treeRowShapeFor(LIST_COLUMN_DEFAULT_PX)).toBe("one-line");
  });

  test("clamps anything a cookie or a drag can offer to its own ends", () => {
    expect(clampListColumnWidthPx(LIST_COLUMN_FLOOR_PX - 200)).toBe(LIST_COLUMN_FLOOR_PX);
    expect(clampListColumnWidthPx(LIST_COLUMN_CEILING_PX + 200)).toBe(LIST_COLUMN_CEILING_PX);
    expect(clampListColumnWidthPx(LIST_COLUMN_DEFAULT_PX)).toBe(LIST_COLUMN_DEFAULT_PX);
    expect(clampListColumnWidthPx(Number.NaN)).toBe(LIST_COLUMN_DEFAULT_PX);
  });
});

describe("the indent", () => {
  test("spends fourteen pixels a rung over the root row's own padding", () => {
    expect([0, 1, 2, 3].map(treeRowIndentPx)).toEqual([16, 30, 44, 58]);
  });

  test("holds at the deepest rung for anything below it", () => {
    expect(treeRowIndentPx(DEEPEST_LEVEL + 4)).toBe(treeRowIndentPx(DEEPEST_LEVEL));
  });
});

describe("the due date slot", () => {
  test("reserves the widest date the formatter can produce, and no more", () => {
    expect(DUE_DATE_SLOT_PX).toBe(43);
  });
});
