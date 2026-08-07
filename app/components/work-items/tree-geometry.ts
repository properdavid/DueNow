/**
 * The Work Items tree's geometry (ADR-0031).
 *
 * A tree row's Summary is the thing being read; everything else on the row
 * annotates it. The tree therefore guarantees the Summary a pixel budget at the
 * deepest rung at every width the list column can take, and the column's own
 * range is derived from that guarantee rather than chosen against it.
 *
 * Adding an element to a tree row means adding it here. The unit test beside
 * this module is what notices when the sums stop working.
 */

/** The four rungs of the Type Ladder, so a Subtask sits at level 3. */
export const DEEPEST_LEVEL = 3;

/** A Summary shorter than this cannot tell two Subtasks of one Project apart. */
const SUMMARY_MINIMUM_CHARACTERS = 24;

type TypeSizePx = 12 | 14 | 16;

/**
 * Recorded measurements, taken on a canvas with the self-hosted Inter Variable
 * (ADR-0031). The average glyph is over nine representative household
 * summaries at weight 500; the due date is the widest string the shared
 * formatter can produce ("May 30"), because a budget defended with a
 * representative date is not a guarantee.
 *
 * Re-measure if the typeface changes. This is the only input to the guarantee
 * that lives outside the code.
 */
const MEASURED: Record<TypeSizePx, { averageGlyphPx: number; widestDueDatePx: number }> = {
  16: { averageGlyphPx: 8.053, widestDueDatePx: 56.66 },
  14: { averageGlyphPx: 7.046, widestDueDatePx: 49.59 },
  12: { averageGlyphPx: 6.04, widestDueDatePx: 42.5 },
};

/** The two typography roles the row's own width depends on. */
const SUMMARY_TYPE_SIZE_PX: TypeSizePx = 14; // body-strong, `text-sm font-medium`
const DUE_DATE_TYPE_SIZE_PX: TypeSizePx = 12; // caption, `text-xs`

/** The guarantee, in the only unit the layout can reason about. */
export const SUMMARY_BUDGET_PX = Math.ceil(
  SUMMARY_MINIMUM_CHARACTERS * MEASURED[SUMMARY_TYPE_SIZE_PX].averageGlyphPx,
);

/** The due date's slot, which dateless rows reserve so their metadata lines up. */
export const DUE_DATE_SLOT_PX = Math.ceil(MEASURED[DUE_DATE_TYPE_SIZE_PX].widestDueDatePx);

/* Measured from the rendered row rather than estimated. */
const PAGE_PADDING_PX = 48; // `p-6` on the tab's wrapper, both sides
const CARD_BORDER_PX = 2; // the tree card's hairline, both sides
const ROW_PADDING_RIGHT_PX = 4; // `pr-1`
const ROW_INDENT_BASE_PX = 4; // the root rung's own left padding
const ROW_INDENT_PER_RUNG_PX = 14; // ADR-0018
const ROW_GAP_PX = 8; // `gap-2` along the row
const META_GAP_PX = 12; // `gap-3` inside the metadata group
const DISCLOSURE_PX = 36; // the chevron's icon button, matched by the spacer a childless row renders
const TYPE_MARK_PX = 16;
const STATUS_MARK_PX = 16;
const AVATAR_PX = 28;
const ROW_MENU_PX = 36;

/** Where the Summary starts, so the stacked row's second line sits under it. */
export const TREE_ROW_META_INDENT_PX = DISCLOSURE_PX + ROW_GAP_PX + TYPE_MARK_PX + ROW_GAP_PX;

/** Gaps sit between flex children, so `count` of them buy one gap fewer. */
function gapsPx(count: number, gapPx: number) {
  return (count - 1) * gapPx;
}

export function treeRowIndentPx(level: number) {
  return ROW_INDENT_BASE_PX + ROW_INDENT_PER_RUNG_PX * Math.min(level, DEEPEST_LEVEL);
}

/** What the row spends before the Summary gets anything, outside the shape. */
function rowChromePx(level: number) {
  return (
    PAGE_PADDING_PX +
    CARD_BORDER_PX +
    treeRowIndentPx(level) +
    ROW_PADDING_RIGHT_PX +
    DISCLOSURE_PX +
    TYPE_MARK_PX +
    ROW_MENU_PX
  );
}

/* The one-line row carries the metadata beside the Summary; the stacked row
   drops it to a second line, where it costs the Summary nothing (ADR-0018). */
function oneLineFixedCostPx(level: number) {
  const metadata = STATUS_MARK_PX + AVATAR_PX + DUE_DATE_SLOT_PX + gapsPx(3, META_GAP_PX);
  // disclosure, type mark, summary, metadata, row menu
  return rowChromePx(level) + metadata + gapsPx(5, ROW_GAP_PX);
}

function stackedFixedCostPx(level: number) {
  // disclosure, type mark, summary, row menu
  return rowChromePx(level) + gapsPx(4, ROW_GAP_PX);
}

export type TreeRowShape = "one-line" | "stacked";

/**
 * The column width at which the one-line row stops fitting the deepest rung.
 * A container query on the list column selects the shape at this number, so the
 * shape that cannot fit is never the shape that renders.
 */
export const LIST_COLUMN_STACK_THRESHOLD_PX = oneLineFixedCostPx(DEEPEST_LEVEL) + SUMMARY_BUDGET_PX;

/** The narrowest column the stacked row still fits the deepest rung into. */
export const LIST_COLUMN_FLOOR_PX = stackedFixedCostPx(DEEPEST_LEVEL) + SUMMARY_BUDGET_PX;

/**
 * Past this the list stops being a list and starts starving the detail view,
 * which ADR-0019 wants read as one document. Chosen rather than derived.
 */
export const LIST_COLUMN_CEILING_PX = 768;

/* The split opens above the threshold so it shows the one-line row, with enough
   margin that nudging the splitter does not restack the whole tree. The margin
   is the fixed part, so the default follows the threshold when a type role
   moves. */
const DEFAULT_ONE_LINE_MARGIN_PX = 24;
export const LIST_COLUMN_DEFAULT_PX = LIST_COLUMN_STACK_THRESHOLD_PX + DEFAULT_ONE_LINE_MARGIN_PX;

export function treeRowShapeFor(columnWidthPx: number): TreeRowShape {
  return columnWidthPx >= LIST_COLUMN_STACK_THRESHOLD_PX ? "one-line" : "stacked";
}

/** What the Summary is actually allocated — in the shape that width renders. */
export function summaryWidthPx(columnWidthPx: number, level: number) {
  const fixed =
    treeRowShapeFor(columnWidthPx) === "one-line"
      ? oneLineFixedCostPx(level)
      : stackedFixedCostPx(level);
  return columnWidthPx - fixed;
}

/** A cookie and a drag can both offer nonsense; neither may leave the range. */
export function clampListColumnWidthPx(widthPx: number) {
  if (!Number.isFinite(widthPx)) return LIST_COLUMN_DEFAULT_PX;
  return Math.min(Math.max(Math.round(widthPx), LIST_COLUMN_FLOOR_PX), LIST_COLUMN_CEILING_PX);
}
