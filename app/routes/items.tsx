import { useMatches } from "react-router";

import type { Route } from "./+types/items";
import { getDatabase, requireUser } from "~/auth/session.server";
import { SplitRoute } from "~/components/shell/split-route";
import { WorkItemsTree, type ItemsLoaderData } from "~/components/work-items/work-items-tree";
import { loadWorkItemsTree } from "~/domain/work-items/work-items.server";

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const user = await requireUser(request, context);
  const selectedId = params.id ? Number(params.id) : null;
  if (selectedId !== null && (!Number.isSafeInteger(selectedId) || selectedId <= 0)) {
    throw new Response("Work Item not found", { status: 404 });
  }
  return { ...loadWorkItemsTree(getDatabase(context), selectedId), user };
}

export { WorkItemsTree };

export default function Items({ loaderData }: Route.ComponentProps) {
  const hasSelection = useMatches().some((match) => match.id === "items-item");
  return (
    <SplitRoute hasSelection={hasSelection}>
      <WorkItemsTree loaderData={loaderData as ItemsLoaderData} />
    </SplitRoute>
  );
}
