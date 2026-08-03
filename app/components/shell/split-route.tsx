import { Outlet } from "react-router";

import { EmptySelectionCard } from "~/components/empty-selection-card";

interface SplitRouteProps {
  children: React.ReactNode;
  hasSelection: boolean;
}

export function SplitRoute({ children, hasSelection }: SplitRouteProps) {
  const listColumnClassName =
    "pb-28 lg:block lg:w-96 lg:min-w-72 lg:max-w-xl lg:resize-x lg:overflow-auto lg:border-r lg:border-border lg:pb-0";

  return (
    <main className="min-h-screen bg-background text-foreground lg:flex lg:h-screen lg:overflow-hidden">
      <section className={hasSelection ? `hidden ${listColumnClassName}` : listColumnClassName}>
        {children}
      </section>
      <aside
        className={
          hasSelection
            ? "min-h-screen bg-background lg:min-h-0 lg:flex-1 lg:overflow-auto"
            : "hidden items-center justify-center lg:flex lg:min-h-0 lg:flex-1 lg:overflow-auto"
        }
      >
        {hasSelection ? <Outlet /> : <EmptySelectionCard />}
      </aside>
    </main>
  );
}
