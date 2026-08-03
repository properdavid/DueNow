import type { Route } from "./+types/settings";
import { requireUser } from "~/auth/session.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireUser(request, context);
  return null;
}

export default function Settings() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Settings</h1>
    </main>
  );
}
