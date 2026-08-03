import { Clock } from "lucide-react";
import { Outlet, useMatches } from "react-router";

import type { Route } from "./+types/due";
import { EmptySelectionCard } from "~/components/empty-selection-card";
import { getDatabase, requireUser } from "~/auth/session.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireUser(request, context);
  const row = getDatabase(context).sqlite.prepare("SELECT COUNT(*) AS count FROM work_items").get() as { count: number };
  return { hasEverHadWorkItems: row.count > 0 };
}

export default function Due({ loaderData }: Route.ComponentProps) {
  const hasSelection = useMatches().some((match) => match.id === "due-item");
  const emptyState = loaderData.hasEverHadWorkItems
    ? { headline: "Nothing on the radar", line: "No work is due in the next 30 days." }
    : {
        headline: "Nothing due yet",
        line: "This is where dated work shows up, 30 days ahead. Create your first work item and give it a due date.",
      };

  return (
    <main className="grid min-h-screen gap-4 bg-background p-6 text-foreground lg:grid-cols-2">
      <section className="flex items-center justify-center">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center text-card-foreground">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Clock aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold">{emptyState.headline}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{emptyState.line}</p>
        </div>
      </section>
      <aside className="hidden items-center justify-center lg:flex">
        {hasSelection ? <Outlet /> : <EmptySelectionCard />}
      </aside>
    </main>
  );
}
