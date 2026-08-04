import { useState } from "react";
import { useRouteLoaderData } from "react-router";

import {
  clampListColumnWidthPx,
  LIST_COLUMN_CEILING_PX,
  LIST_COLUMN_DEFAULT_PX,
  LIST_COLUMN_FLOOR_PX,
} from "~/components/work-items/tree-geometry";
import { listColumnWidthCookie } from "~/components/shell/list-column-width";

/**
 * The splitter on the shared border (ADR-0031).
 *
 * It owns a width and nothing else: the list and the detail are handed a number
 * and never learn where it came from. It replaces CSS `resize-x`, whose grip is
 * a corner triangle that paints nothing under overlay scrollbars — the border
 * between the columns, where every split interface trains you to reach, was
 * inert.
 */

/** One arrow press. Coarse enough to cross the range, fine enough to aim. */
const KEYBOARD_STEP_PX = 16;

export function useListColumnWidth() {
  const shellData = useRouteLoaderData("routes/shell") as { listColumnWidthPx?: number } | undefined;
  return useState(() => clampListColumnWidthPx(shellData?.listColumnWidthPx ?? LIST_COLUMN_DEFAULT_PX));
}

export function ListColumnSplitter({
  widthPx,
  onWidthChange,
}: {
  widthPx: number;
  onWidthChange: (widthPx: number) => void;
}) {
  const [drag, setDrag] = useState<{ pointerId: number; startX: number; startWidthPx: number } | null>(null);

  function commit(nextWidthPx: number) {
    const clamped = clampListColumnWidthPx(nextWidthPx);
    onWidthChange(clamped);
    return clamped;
  }

  function remember(nextWidthPx: number) {
    document.cookie = listColumnWidthCookie(nextWidthPx);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const next = {
      ArrowLeft: widthPx - KEYBOARD_STEP_PX,
      ArrowRight: widthPx + KEYBOARD_STEP_PX,
      Home: LIST_COLUMN_FLOOR_PX,
      End: LIST_COLUMN_CEILING_PX,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    remember(commit(next));
  }

  return (
    <div
      aria-controls="list-column"
      aria-label="List column width"
      aria-orientation="vertical"
      aria-valuemax={LIST_COLUMN_CEILING_PX}
      aria-valuemin={LIST_COLUMN_FLOOR_PX}
      aria-valuenow={widthPx}
      className={
        "relative hidden w-px shrink-0 cursor-col-resize touch-none bg-border " +
        "before:absolute before:inset-y-0 before:-left-1 before:-right-1 before:content-[''] " +
        "hover:bg-primary focus-visible:bg-primary focus-visible:outline-none lg:block"
      }
      role="separator"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        setDrag({ pointerId: event.pointerId, startX: event.clientX, startWidthPx: widthPx });
      }}
      onPointerMove={(event) => {
        if (drag?.pointerId !== event.pointerId) return;
        commit(drag.startWidthPx + (event.clientX - drag.startX));
      }}
      onPointerUp={(event) => {
        if (drag?.pointerId !== event.pointerId) return;
        setDrag(null);
        // One write at the end of the gesture rather than one per pixel.
        remember(commit(drag.startWidthPx + (event.clientX - drag.startX)));
      }}
    />
  );
}
