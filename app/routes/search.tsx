import { Outlet } from "react-router";

import type { Route } from "./+types/search";
import { requireUser } from "~/auth/session.server";

export const handle = { layout: "full" };

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireUser(request, context);
  return null;
}

export default function Search() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Search</h1>
      <Outlet />
    </main>
  );
}
