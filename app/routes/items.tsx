import { Outlet, useMatches } from "react-router";

import type { Route } from "./+types/items";
import { EmptySelectionCard } from "~/components/empty-selection-card";
import { requireUser } from "~/auth/session.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireUser(request, context);
  return null;
}

export default function Items() {
  const hasSelection = useMatches().some((match) => match.id === "items-item");

  return (
    <main className="grid min-h-screen gap-4 bg-background p-6 text-foreground lg:grid-cols-2">
      <section>
        <h1 className="text-xl font-semibold">Work Items</h1>
      </section>
      <aside className="hidden items-center justify-center lg:flex">
        {hasSelection ? <Outlet /> : <EmptySelectionCard />}
      </aside>
    </main>
  );
}
