import { useMatches } from "react-router";

import type { Route } from "./+types/items";
import { SplitRoute } from "~/components/shell/split-route";

export async function loader(_: Route.LoaderArgs) {
  return null;
}

export default function Items() {
  const hasSelection = useMatches().some((match) => match.id === "items-item");

  return (
    <SplitRoute hasSelection={hasSelection}>
      <div className="p-6">
        <h1 className="text-xl font-semibold">Work Items</h1>
        <div className="mt-6 rounded-lg border border-border bg-card p-6 text-card-foreground">
          <p className="text-sm text-muted-foreground">The Work Items Tree will appear here.</p>
        </div>
      </div>
    </SplitRoute>
  );
}
