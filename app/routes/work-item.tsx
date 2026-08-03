import type { Route } from "./+types/work-item";
import { Link, useLocation } from "react-router";

export async function loader({ params }: Route.LoaderArgs) {
  return { id: params.id };
}

export default function WorkItem({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  const backLink = location.pathname.startsWith("/search/")
    ? { href: `/search${location.search}`, label: "← Back to results", compactOnly: false }
    : location.pathname.startsWith("/due/")
      ? { href: "/due", label: "← Back to Due", compactOnly: true }
      : location.pathname.startsWith("/items/")
        ? { href: "/items", label: "← Back to Work Items", compactOnly: true }
        : null;

  return (
    <section className="min-h-screen bg-background p-6 text-foreground lg:min-h-full">
      <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
        {backLink ? (
          <Link
            className={backLink.compactOnly ? "mb-4 inline-block text-sm text-muted-foreground lg:hidden" : "mb-4 inline-block text-sm text-muted-foreground"}
            to={backLink.href}
          >
            {backLink.label}
          </Link>
        ) : null}
        <p className="mb-2 text-sm text-muted-foreground">Ancestors appear here.</p>
        <h2 className="text-lg font-semibold">Work Item {loaderData.id}</h2>
        <p className="mt-2 text-sm text-muted-foreground">The Detail View will appear here.</p>
      </div>
    </section>
  );
}
