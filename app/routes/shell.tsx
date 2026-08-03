import { Clock, ListTree, Search, Settings } from "lucide-react";
import { NavLink, Outlet, useMatches } from "react-router";

import type { Route } from "./+types/shell";
import { getDatabase, requireUser } from "~/auth/session.server";
import { CreationDialog } from "~/components/shell/creation-dialog";

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
  return { user, members, labels, householdTimezone };
}

export const destinations = [
  { href: "/due", label: "Due", Icon: Clock },
  { href: "/items", label: "Work Items", Icon: ListTree },
  { href: "/search", label: "Search", Icon: Search },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function Shell(_: Route.ComponentProps) {
  const isFullLayout = useMatches().some((match) => {
    const handle = match.handle as { layout?: string } | undefined;
    return handle?.layout === "full";
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="hidden border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:w-64">
        <p className="wordmark mb-4 text-primary">DueNow</p>
        <CreationDialog />
        <nav className="space-y-1" aria-label="Primary">
          {destinations.map(({ href, label }) => (
            <NavLink
              className={({ isActive }) =>
                `block rounded-md border border-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`
              }
              key={href}
              to={href}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className={isFullLayout ? "pb-28 lg:pl-64 lg:pb-0" : "lg:h-screen lg:overflow-hidden lg:pl-64"}>
        <Outlet />
      </div>
      <CreationDialog compact />
      <nav
        className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md justify-around rounded-full border border-border bg-card p-1 text-card-foreground lg:hidden"
        aria-label="Primary"
      >
        {destinations.map(({ href, label, Icon }) => (
          <NavLink
            className={({ isActive }) =>
              `flex min-w-16 flex-col items-center rounded-full px-3 py-2 text-sm ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`
            }
            key={href}
            to={href}
          >
            <Icon aria-hidden="true" />
            <span className="text-sm">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
