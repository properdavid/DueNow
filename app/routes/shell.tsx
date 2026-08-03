import { Clock, ListTree, Search, Settings } from "lucide-react";
import { NavLink, Outlet, useMatches } from "react-router";

import type { Route } from "./+types/shell";
import { getDatabase, requireUser } from "~/auth/session.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const user = await requireUser(request, context);
  const database = getDatabase(context);
  const members = database.sqlite.prepare("SELECT id, email, name, theme FROM users ORDER BY name, email").all();
  const labels = database.sqlite.prepare("SELECT id, name FROM labels ORDER BY lower(name)").all();
  const householdSettings = database.sqlite.prepare("SELECT timezone FROM household_settings WHERE id = 1").get();
  return { user, members, labels, householdSettings };
}

const destinations = [
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
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground lg:block">
        <p className="mb-4 text-xl font-semibold tracking-[-0.025em] text-primary">DueNow</p>
        <nav className="space-y-1" aria-label="Primary">
          {destinations.map(({ href, label }) => (
            <NavLink
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`
              }
              key={href}
              to={href}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className={isFullLayout ? "pb-20 lg:pb-0" : "pb-20 lg:h-screen lg:overflow-hidden lg:pb-0"}>
        <Outlet />
      </div>
      <nav
        className="fixed inset-x-4 bottom-4 flex justify-around rounded-full border border-border bg-card p-1 text-card-foreground lg:hidden"
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
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
