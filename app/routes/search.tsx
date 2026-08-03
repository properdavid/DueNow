import { Outlet, useMatches } from "react-router";

import type { Route } from "./+types/search";
import { getDatabase, requireUser } from "~/auth/session.server";
import { searchWorkItems } from "~/domain/work-items/work-items.server";
import { searchWorkItemsInputFromUrl } from "./search-params";

export const handle = { layout: "full" };

export async function loader({ request, context }: Route.LoaderArgs) {
  const user = await requireUser(request, context);
  const url = new URL(request.url);
  return { ...searchWorkItems(getDatabase(context), searchWorkItemsInputFromUrl(url)), user };
}

export default function Search() {
  const hasSelection = useMatches().some((match) => match.id === "search-item");

  return (
    <main className="min-h-screen bg-background p-6 pb-28 text-foreground lg:pb-6">
      <div className={hasSelection ? "hidden" : undefined}>
        <h1 className="text-xl font-semibold">Search</h1>
        <div className="mt-6 rounded-lg border border-border bg-card p-6 text-card-foreground">
          <p className="text-sm text-muted-foreground">The Results Table and Filter Bar will appear here.</p>
        </div>
      </div>
      {hasSelection ? <Outlet /> : null}
    </main>
  );
}
