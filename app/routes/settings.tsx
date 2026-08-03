import type { Route } from "./+types/settings";

export async function loader(_: Route.LoaderArgs) {
  return null;
}

export default function Settings() {
  return (
    <main className="min-h-screen bg-background p-6 pb-28 text-foreground lg:pb-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      <div className="mt-6 rounded-lg border border-border bg-card p-6 text-card-foreground">
        <p className="text-sm text-muted-foreground">Household settings will appear here.</p>
      </div>
    </main>
  );
}
