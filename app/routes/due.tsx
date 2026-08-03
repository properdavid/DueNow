import { Clock } from "lucide-react";
import { useMatches } from "react-router";

import type { Route } from "./+types/due";
import { getDatabase } from "~/auth/session.server";
import { EmptyCard } from "~/components/shell/empty-card";
import { SplitRoute } from "~/components/shell/split-route";

export async function loader({ context }: Route.LoaderArgs) {
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
    <SplitRoute hasSelection={hasSelection}>
      <div className="flex min-h-screen items-center justify-center p-6 lg:min-h-full">
        <EmptyCard headline={emptyState.headline} line={emptyState.line} Mark={Clock} />
      </div>
    </SplitRoute>
  );
}
