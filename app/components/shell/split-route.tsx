import { Outlet } from "react-router";

import { EmptySelectionCard } from "~/components/empty-selection-card";
import { ListColumnSplitter, useListColumnWidth } from "~/components/shell/list-column-splitter";

interface SplitRouteProps {
  children: React.ReactNode;
  hasSelection: boolean;
}

export function SplitRoute({ children, hasSelection }: SplitRouteProps) {
  const [listColumnWidthPx, setListColumnWidthPx] = useListColumnWidth();
  /* `@container` makes the column the thing its rows measure themselves against,
     so a narrow column on a wide screen reads as narrow (ADR-0031). */
  const listColumnClassName =
    "@container pb-28 lg:block lg:w-(--list-column-width) lg:shrink-0 lg:overflow-auto lg:pb-0";

  return (
    <main className="min-h-screen bg-background text-foreground lg:flex lg:h-screen lg:overflow-hidden">
      <section
        className={hasSelection ? `hidden ${listColumnClassName}` : listColumnClassName}
        id="list-column"
        style={{ "--list-column-width": `${listColumnWidthPx}px` } as React.CSSProperties}
      >
        {children}
      </section>
      <ListColumnSplitter widthPx={listColumnWidthPx} onWidthChange={setListColumnWidthPx} />
      <aside
        className={
          hasSelection
            ? "min-h-screen bg-background pb-28 lg:min-h-0 lg:flex-1 lg:overflow-auto lg:pb-0"
            : "hidden items-center justify-center lg:flex lg:min-h-0 lg:flex-1 lg:overflow-auto"
        }
      >
        {hasSelection ? <Outlet /> : <EmptySelectionCard />}
      </aside>
    </main>
  );
}
