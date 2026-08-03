import type { Route } from "./+types/work-item";
import { requireUser } from "~/auth/session.server";

export async function loader({ request, context, params }: Route.LoaderArgs) {
  await requireUser(request, context);
  return { id: params.id };
}

export default function WorkItem({ loaderData }: Route.ComponentProps) {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card p-6 text-card-foreground">
      <h2 className="text-lg font-semibold">Work Item {loaderData.id}</h2>
    </section>
  );
}
