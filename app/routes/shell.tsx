import { Clock, ListTree, Search, Settings } from "lucide-react";
import { NavLink, Outlet, useMatches } from "react-router";

import type { Route } from "./+types/shell";
import { getDatabase, requireUser } from "~/auth/session.server";
import { CreationDialogProvider, CreationDialogTrigger } from "~/components/shell/creation-dialog";
import { listColumnWidthFromCookieHeader } from "~/components/shell/list-column-width";

type ShellMember = { id: number; email: string; name: string; theme: "system" | "light" | "dark" };
type ShellLabel = { id: number; name: string };
type HouseholdTimezone = { timezone: string };

export async function loader({ request, context }: Route.LoaderArgs) {
  const user = await requireUser(request, context);
  const database = getDatabase(context);
  const members = database.sqlite
    .prepare("SELECT id, email, name, theme FROM users ORDER BY name, email")
    .all() as ShellMember[];
  const labels = database.sqlite.prepare("SELECT id, name FROM labels ORDER BY lower(name)").all() as ShellLabel[];
  const householdTimezone = database.sqlite
    .prepare("SELECT timezone FROM household_settings WHERE id = 1")
    .get() as HouseholdTimezone;
  /* The split's geometry is settled here, beneath every route that draws one, so
     the first paint is the width the browser already chose (ADR-0031). */
  const listColumnWidthPx = listColumnWidthFromCookieHeader(request.headers.get("Cookie"));
  return { user, members, labels, householdTimezone, listColumnWidthPx };
}

export const destinations = [
  { href: "/due", label: "Due", Icon: Clock },
  { href: "/items", label: "Work Items", Icon: ListTree },
  { href: "/search", label: "Search", Icon: Search },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function Shell({ loaderData }: Route.ComponentProps) {
  const matches = useMatches();
  const isFullLayout = matches.some((match) => {
    const handle = match.handle as { layout?: string } | undefined;
    return handle?.layout === "full";
  });
  const suppressesFab = matches.some((match) => {
    const handle = match.handle as { fab?: string } | undefined;
    return handle?.fab === "none";
  });

  return (
    <CreationDialogProvider members={loaderData.members} labels={loaderData.labels}>
      <div className="min-h-screen bg-background text-foreground">
        <aside className="hidden border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:w-64">
          <p className="wordmark mb-4 text-primary">DueNow</p>
          <CreationDialogTrigger />
          <nav className="space-y-1" aria-label="Primary">
            {destinations.map(({ href, label }) => (
              <NavLink
                className={({ isActive }) =>
                  `block rounded-md border border-transparent px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`
                }
                key={href}
                to={href}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div
          className={
            isFullLayout
              ? "pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-64"
              : "lg:h-screen lg:overflow-hidden lg:pl-64"
          }
        >
          <Outlet />
        </div>
        {suppressesFab ? null : <CreationDialogTrigger compact />}
        <nav
          className="fixed inset-x-4 z-50 mx-auto flex max-w-md justify-around rounded-full border border-border bg-card p-1 text-card-foreground lg:hidden"
          style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          aria-label="Primary"
        >
          {destinations.map(({ href, label, Icon }) => (
            <NavLink
              className={({ isActive }) =>
                `flex min-w-16 flex-col items-center rounded-full px-3 py-2 text-xs ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`
              }
              key={href}
              to={href}
            >
              <Icon aria-hidden="true" className="size-5" />
              <span className="text-xs">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </CreationDialogProvider>
  );
}
