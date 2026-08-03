import type React from "react";
import { Form, useFetcher, useRouteLoaderData } from "react-router";

import type { Route } from "./+types/settings";
import { getDatabase, requireUser } from "~/auth/session.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Avatar } from "~/components/ui/work-item-marks";
import { loadSettings } from "~/domain/settings/settings.server";
import { controlErrorMessage } from "~/pwa/unreachable";

type MutationFetcherData = { ok: true } | { ok: false; error: { field?: string; message: string } };
type SettingsMember = { id: number; email: string; name: string; theme: "system" | "light" | "dark" };
type ShellLabel = { id: number; name: string };
type SettingsLabel = ShellLabel & { usageCount: number };
type ShellLoaderData = {
  user: SettingsMember;
  members: SettingsMember[];
  labels: ShellLabel[];
  householdTimezone: { timezone: string };
};

const themeOptions = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireUser(request, context);
  return loadSettings(getDatabase(context));
}

export default function Settings({ loaderData }: Route.ComponentProps) {
  const shellData = useRouteLoaderData("routes/shell") as ShellLoaderData;
  return <SettingsPage loaderData={loaderData} shellData={shellData} />;
}

export function SettingsPage({ loaderData, shellData }: { loaderData: Route.ComponentProps["loaderData"]; shellData: ShellLoaderData }) {
  const usageCounts = new Map(loaderData.labelUsageCounts.map((row) => [row.labelId, row.usageCount]));
  const labels = shellData.labels.map((label) => ({ ...label, usageCount: usageCounts.get(label.id) ?? 0 }));
  const timezones = timezonesIncluding(loaderData.timezones, shellData.householdTimezone.timezone);

  return (
    <main className="min-h-screen bg-background p-6 pb-28 text-foreground lg:pb-6">
      <header>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Personal choices and shared household controls.</p>
      </header>

      <div className="mt-6 space-y-6">
        <Section title="You" description="Theme follows your user record. Sign out is here because the shell has no title bar.">
          <ThemeForm theme={shellData.user.theme} />
          <div className="border-t border-border pt-4">
            <Form action="/auth/logout" method="post">
              <Button type="submit" variant="outline">
                Sign out
              </Button>
            </Form>
          </div>
        </Section>

        <Section title="Household" description="Shared facts for the one household served by this DueNow instance.">
          <MembersList members={shellData.members} currentUserId={shellData.user.id} />
          <TimezoneForm timezone={shellData.householdTimezone.timezone} timezones={timezones} />
          <LabelManagement labels={labels} />
        </Section>
      </div>
    </main>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-6 text-card-foreground" aria-labelledby={`${title.toLowerCase()}-settings`}>
      <div className="mb-6">
        <h2 id={`${title.toLowerCase()}-settings`} className="text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function ThemeForm({ theme }: { theme: "system" | "light" | "dark" }) {
  const fetcher = useFetcher<MutationFetcherData>();
  return (
    <fetcher.Form action="/api/settings/theme" method="post" className="grid gap-2 sm:max-w-sm">
      <label className="text-sm font-medium" htmlFor="theme">
        Theme
      </label>
      <div className="flex items-center gap-2">
        <Select id="theme" name="theme" defaultValue={theme} aria-describedby="theme-help">
          {themeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          {fetcher.state === "idle" ? "Save" : "Saving"}
        </Button>
      </div>
      <p id="theme-help" className="text-sm text-muted-foreground">
        System uses your device preference without JavaScript.
      </p>
      {fetcher.data?.ok === false ? <p className="text-sm text-destructive">{controlErrorMessage(fetcher.data.error.message)}</p> : null}
    </fetcher.Form>
  );
}

function MembersList({ members, currentUserId }: { members: SettingsMember[]; currentUserId: number }) {
  return (
    <section className="space-y-3" aria-labelledby="members-heading">
      <h3 id="members-heading" className="text-base font-semibold">
        Members
      </h3>
      <div className="divide-y divide-border rounded-lg border border-border">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <Avatar assignee={member} currentUserId={currentUserId} />
              <div>
                <p className="text-base font-medium">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TimezoneForm({ timezone, timezones }: { timezone: string; timezones: string[] }) {
  const fetcher = useFetcher<MutationFetcherData>();
  return (
    <fetcher.Form action="/api/settings/timezone" method="post" className="grid gap-2 sm:max-w-xl">
      <label className="text-sm font-medium" htmlFor="timezone">
        Household Timezone
      </label>
      <div className="flex items-center gap-2">
        <Select id="timezone" name="timezone" defaultValue={timezone} aria-describedby="timezone-help">
          {timezones.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          {fetcher.state === "idle" ? "Save" : "Saving"}
        </Button>
      </div>
      <p id="timezone-help" className="text-sm text-muted-foreground">
        Today and Due tab groups are computed in this timezone for both members.
      </p>
      {fetcher.data?.ok === false ? <p className="text-sm text-destructive">{controlErrorMessage(fetcher.data.error.message)}</p> : null}
    </fetcher.Form>
  );
}

function LabelManagement({ labels }: { labels: SettingsLabel[] }) {
  const createFetcher = useFetcher<MutationFetcherData>();
  return (
    <section className="space-y-4" aria-labelledby="labels-heading">
      <div>
        <h3 id="labels-heading" className="text-base font-semibold">
          Labels
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">Create, rename and delete the household Label vocabulary.</p>
      </div>
      <createFetcher.Form action="/api/labels/create" method="post" className="flex max-w-xl items-end gap-2">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium" htmlFor="new-label-name">
            New Label
          </label>
          <Input id="new-label-name" name="name" maxLength={30} placeholder="Groceries" />
        </div>
        <Button type="submit" variant="secondary">
          {createFetcher.state === "idle" ? "Create Label" : "Creating"}
        </Button>
      </createFetcher.Form>
      {createFetcher.data?.ok === false ? <p className="text-sm text-destructive">{controlErrorMessage(createFetcher.data.error.message)}</p> : null}

      {labels.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">No Labels yet.</div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {labels.map((label) => (
            <LabelRow key={label.id} label={label} />
          ))}
        </div>
      )}
    </section>
  );
}

function LabelRow({ label }: { label: SettingsLabel }) {
  const renameFetcher = useFetcher<MutationFetcherData>();
  const deleteFetcher = useFetcher<MutationFetcherData>();
  const workItemWord = label.usageCount === 1 ? "Work Item" : "Work Items";
  return (
    <div className="grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="space-y-2">
        <renameFetcher.Form action={`/api/labels/${label.id}/rename`} method="post" className="flex max-w-xl items-end gap-2">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium" htmlFor={`label-${label.id}-name`}>
              {label.name}
            </label>
            <Input id={`label-${label.id}-name`} name="name" defaultValue={label.name} maxLength={30} />
          </div>
          <Button type="submit" variant="outline">
            {renameFetcher.state === "idle" ? "Rename" : "Renaming"}
          </Button>
        </renameFetcher.Form>
        <p className="text-sm text-muted-foreground">
          {label.usageCount} {workItemWord}
        </p>
        <p className="text-sm text-destructive">Deleting detaches this Label everywhere.</p>
        {renameFetcher.data?.ok === false ? <p className="text-sm text-destructive">{controlErrorMessage(renameFetcher.data.error.message)}</p> : null}
      </div>
      <deleteFetcher.Form action={`/api/labels/${label.id}/delete`} method="post">
        <Button type="submit" variant="destructive">
          {deleteFetcher.state === "idle" ? "Delete" : "Deleting"}
        </Button>
      </deleteFetcher.Form>
      {deleteFetcher.data?.ok === false ? <p className="text-sm text-destructive">{controlErrorMessage(deleteFetcher.data.error.message)}</p> : null}
    </div>
  );
}

function timezonesIncluding(timezones: string[], timezone: string) {
  return timezones.includes(timezone) ? timezones : [timezone, ...timezones];
}
