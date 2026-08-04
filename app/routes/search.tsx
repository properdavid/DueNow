import { Search as SearchIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Form, Link, Outlet, useFetcher, useLocation, useMatches, useNavigate } from "react-router";

import type { Route } from "./+types/search";
import { getDatabase, requireUser } from "~/auth/session.server";
import { EmptyCard } from "~/components/shell/empty-card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Avatar, StatusMark, TypeMark } from "~/components/ui/work-item-marks";
import { ParentPicker } from "~/components/work-items/parent-picker";
import type { DatabaseClient } from "~/db/client";
import { formatDueDate } from "~/lib/dates";
import { searchWorkItems, type ParentCandidate, type SearchDirection, type SearchSort, type SearchWorkItemRow } from "~/domain/work-items/work-items.server";
import type { WorkItemStatus, WorkItemType } from "~/db/schema";
import { searchWorkItemsInputFromUrl } from "./search-params";

export const handle = { layout: "full" };

export async function loader({ request, context }: Route.LoaderArgs) {
  const user = await requireUser(request, context);
  const url = new URL(request.url);
  const database = getDatabase(context);
  const input = searchWorkItemsInputFromUrl(url);
  return {
    ...searchWorkItems(database, input),
    selectedParents: loadSelectedParents(database, input.parentIds ?? []),
    user,
  };
}

type ShellSearchData = {
  members: { id: number; email: string; name: string }[];
  labels: { id: number; name: string }[];
};
type SelectedParent = { id: number; summary: string };
type ParentPickerData = { ok: boolean; candidates: ParentCandidate[] };

const sortLabels = {
  id: "#",
  type: "Type",
  summary: "Summary",
  parent: "Parent",
  assignee: "Assignee",
  status: "Status",
  due: "Due",
  updated: "Updated",
} as const satisfies Record<SearchSort, string>;
const tableSorts = ["id", "summary", "parent", "assignee", "status", "due", "updated"] as const satisfies readonly SearchSort[];

const typeLabels = { topic: "Topic", project: "Project", task: "Task", subtask: "Subtask" } as const satisfies Record<WorkItemType, string>;
const statusLabels = { open: "Open", in_progress: "In Progress", completed: "Completed", closed: "Closed" } as const satisfies Record<WorkItemStatus, string>;
const dueLabels = { any: "Any", overdue: "Overdue", before: "Before", after: "After", between: "Between", none: "No due date" } as const;

export default function Search({ loaderData }: Route.ComponentProps) {
  const hasSelection = useMatches().some((match) => match.id === "search-item");
  const shellData = useShellSearchData();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const activeFilters = activeFilterCount(params);
  const isKeywordMiss = Boolean(params.get("q")?.trim()) || activeFilters > 0;

  return (
    <main className="min-h-screen bg-background p-6 pb-28 text-foreground lg:pb-6">
      <div className={hasSelection ? "hidden" : undefined}>
        <header className="space-y-4">
          <div>
            <h1 className="text-xl font-semibold">Search</h1>
            <p className="mt-1 text-xs text-muted-foreground">A read-only register over every Work Item.</p>
          </div>
          <KeywordBox params={params} />
          <div className="hidden lg:block">
            <FilterBar labels={shellData.labels} members={shellData.members} selectedParents={loaderData.selectedParents} params={params} />
          </div>
          <CompactFilters labels={shellData.labels} members={shellData.members} params={params} />
        </header>

        <section className="mt-6 space-y-3" aria-label="Search results">
          <p className="text-xs font-medium text-muted-foreground">{resultCountText(loaderData.resultCount, loaderData.rows.length, loaderData.limit)}</p>
          {loaderData.rows.length === 0 ? (
            <div className="flex min-h-96 items-center justify-center">
              <EmptyCard
                headline={isKeywordMiss ? "No matching work items" : "Nothing searchable yet"}
                line={isKeywordMiss ? "Change the Filter Bar or try a different Keyword." : "Create your first work item and it will appear here."}
                Mark={SearchIcon}
              />
            </div>
          ) : (
            <Results rows={loaderData.rows} params={params} currentUserId={loaderData.user.id} />
          )}
        </section>
      </div>
      {hasSelection ? <Outlet /> : null}
    </main>
  );
}

function KeywordBox({ params }: { params: URLSearchParams }) {
  const navigate = useNavigate();
  return (
    <Form
      action="/search"
      method="get"
      className="flex max-w-2xl gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        navigate(searchPathFromForm(event.currentTarget));
      }}
    >
      <PreservedInputs params={params} except={["q"]} />
      <Input aria-label="Keyword" name="q" defaultValue={params.get("q") ?? ""} placeholder="Keyword" />
      <Button type="submit" variant="outline">Search</Button>
    </Form>
  );
}

function PreservedInputs({ params, except }: { params: URLSearchParams; except: string[] }) {
  const exceptSet = new Set(except);
  return (
    <>
      {[...params.entries()]
        .filter(([name, value]) => !exceptSet.has(name) && value.length > 0)
        .map(([name, value], index) => <input key={`${name}-${index}`} type="hidden" name={name} value={value} />)}
    </>
  );
}

function FilterBar({ labels, members, selectedParents, params }: { labels: { id: number; name: string }[]; members: { id: number; name: string; email: string }[]; selectedParents: SelectedParent[]; params: URLSearchParams }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-3 text-card-foreground">
      <MultiFilter label="Type" param="type" options={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))} params={params} />
      <MultiFilter label="Status" param="status" options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} params={params} />
      <MultiFilter label="Assignee" param="who" options={[{ value: "unassigned", label: "Unassigned" }, ...members.map((member) => ({ value: String(member.id), label: member.name }))]} params={params} />
      <ParentFilter selectedParents={selectedParents} params={params} />
      <DueFilter params={params} />
      <MultiFilter label="Labels" param="labels" options={labels.map((label) => ({ value: String(label.id), label: label.name }))} params={params} />
    </div>
  );
}

function MultiFilter({ label, param, options, params }: { label: string; param: string; options: { value: string; label: string }[]; params: URLSearchParams }) {
  const selected = selectedValues(params, param);
  const active = selected.length > 0;
  return (
    <details className="relative">
      <summary className={`list-none rounded-md border px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${active ? "border-primary bg-accent text-accent-foreground" : "border-input bg-card text-foreground"}`}>
        {label}: {active ? selected.map((value) => options.find((option) => option.value === value)?.label ?? value).join(", ") : "Any"}
      </summary>
      <div className="absolute z-40 mt-1 min-w-56 space-y-1 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
        <Link className="block rounded-md px-3 py-2 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" to={searchHref(params, { [param]: [] })}>
          Any
        </Link>
        {options.map((option) => {
          const values = toggleValue(selected, option.value);
          return (
            <Link key={option.value} className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" to={searchHref(params, { [param]: values })}>
              <span className="inline-block size-4 rounded-sm border border-border bg-card text-center text-[10px] font-bold uppercase tracking-wide">{selected.includes(option.value) ? "✓" : ""}</span>
              {option.label}
            </Link>
          );
        })}
      </div>
    </details>
  );
}

function ParentFilter({ selectedParents, params }: { selectedParents: SelectedParent[]; params: URLSearchParams }) {
  const navigate = useNavigate();
  const selectedParentIds = selectedValues(params, "parent");
  const [parentQuery, setParentQuery] = useState("");
  const parentFetchers = useParentCandidateFetchers(parentQuery);
  const candidates = parentFetchers.candidates;
  const filteredCandidates = candidates.filter((candidate) => candidate.summary.toLowerCase().includes(parentQuery.trim().toLowerCase()));
  const active = selectedParents.length > 0;
  return (
    <details className="relative" onToggle={(event) => {
      if (event.currentTarget.open) {
        parentFetchers.load();
      }
    }}>
      <summary className={`list-none rounded-md border px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${active ? "border-primary bg-accent text-accent-foreground" : "border-input bg-card text-foreground"}`}>
        Parent: {active ? selectedParents.map((parent) => parent.summary).join(", ") : "Any"}
      </summary>
      <div className="absolute z-40 mt-1 w-80 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
        <Link className="mb-2 block rounded-md px-3 py-2 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" to={searchHref(params, { parent: [] })}>
          Any Parent
        </Link>
        {active ? (
          <div className="mb-2 flex flex-wrap gap-1">
            {selectedParents.map((parent) => (
              <Link key={parent.id} className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" to={searchHref(params, { parent: selectedParentIds.filter((id) => id !== String(parent.id)) })}>
                {parent.summary} ×
              </Link>
            ))}
          </div>
        ) : null}
        <ParentPicker
          candidates={filteredCandidates}
          loading={parentFetchers.loading}
          parentQuery={parentQuery}
          prefilledParentSummary={selectedParents[0]?.summary ?? null}
          selectedParentId={selectedParents[0]?.id ?? null}
          setParentQuery={setParentQuery}
          setSelectedParentId={(id) => navigate(searchHref(params, { parent: toggleValue(selectedParentIds, String(id)) }))}
        />
      </div>
    </details>
  );
}

function DueFilter({ params }: { params: URLSearchParams }) {
  const navigate = useNavigate();
  const due = params.get("due") ?? "any";
  const active = due !== "any";
  return (
    <details className="relative">
      <summary className={`list-none rounded-md border px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${active ? "border-primary bg-accent text-accent-foreground" : "border-input bg-card text-foreground"}`}>
        Due Date: {dueSummary(params)}
      </summary>
      <div className="absolute z-40 mt-1 min-w-72 space-y-2 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
        {(["any", "overdue", "none"] as const).map((mode) => (
          <Link key={mode} className="block rounded-md px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" to={searchHref(params, mode === "any" ? { due: [], from: [], to: [] } : { due: [mode], from: [], to: [] })}>
            {dueLabels[mode]}
          </Link>
        ))}
        <DueDateChoice params={params} mode="before" navigate={navigate} />
        <DueDateChoice params={params} mode="after" navigate={navigate} />
        <DueDateChoice params={params} mode="between" navigate={navigate} />
      </div>
    </details>
  );
}

function DueDateChoice({ params, mode, navigate }: { params: URLSearchParams; mode: "before" | "after" | "between"; navigate: ReturnType<typeof useNavigate> }) {
  const selected = (params.get("due") ?? "any") === mode;
  if (!selected) {
    return (
      <Link className="block rounded-md px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" to={searchHref(params, { due: [mode], from: [], to: [] })}>
        {dueLabels[mode]}
      </Link>
    );
  }
  const setDate = (name: "from" | "to", value: string) => {
    navigate(searchHref(params, { due: [mode], [name]: value ? [value] : [] }));
  };
  return (
    <div className="space-y-2 rounded-md border border-border p-2">
      <p className="text-xs font-medium">{dueLabels[mode]}</p>
      <Input aria-label={`${dueLabels[mode]} from`} type="date" defaultValue={params.get("from") ?? ""} onChange={(event) => setDate("from", event.currentTarget.value)} />
      {mode === "between" ? <Input aria-label="Between to" type="date" defaultValue={params.get("to") ?? ""} onChange={(event) => setDate("to", event.currentTarget.value)} /> : null}
    </div>
  );
}

function CompactFilters({ labels, members, params }: { labels: { id: number; name: string }[]; members: { id: number; name: string; email: string }[]; params: URLSearchParams }) {
  const active = activeFilterCount(params) > 0;
  const navigate = useNavigate();
  return (
    <div className="lg:hidden">
      <Dialog>
        <DialogTrigger asChild>
          <Button className={active ? "text-primary" : undefined} type="button" variant="outline">Filters</Button>
        </DialogTrigger>
        <DialogContent className="bottom-0 top-auto max-h-[85vh] translate-y-0 overflow-auto rounded-b-none">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
            <DialogDescription>Choose filters, then apply them together.</DialogDescription>
          </DialogHeader>
          <Form
            action="/search"
            method="get"
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              navigate(searchPathFromForm(event.currentTarget));
            }}
          >
            <CompactSort params={params} />
            <CompactSelect name="type" label="Type" options={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))} params={params} />
            <CompactSelect name="status" label="Status" options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} params={params} />
            <CompactSelect name="who" label="Assignee" options={[{ value: "unassigned", label: "Unassigned" }, ...members.map((member) => ({ value: String(member.id), label: member.name }))]} params={params} />
            <CompactParentSelect params={params} />
            <CompactDue params={params} />
            <CompactSelect name="labels" label="Labels" options={labels.map((label) => ({ value: String(label.id), label: label.name }))} params={params} />
            <DialogFooter>
              <Button type="submit">Apply</Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompactSort({ params }: { params: URLSearchParams }) {
  return (
    <div className="grid gap-2">
      <label className="text-xs font-medium" htmlFor="compact-sort">Sort</label>
      <div className="grid grid-cols-2 gap-2">
        <Select id="compact-sort" name="sort" defaultValue={params.get("sort") ?? "id"}>
          {tableSorts.map((value) => <option key={value} value={value}>{sortLabels[value]}</option>)}
        </Select>
        <Select name="dir" aria-label="Sort direction" defaultValue={params.get("dir") ?? "asc"}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </Select>
      </div>
      <PreservedInputs params={params} except={["sort", "dir", "type", "status", "who", "parent", "due", "from", "to", "labels"]} />
    </div>
  );
}

function CompactSelect({ name, label, options, params }: { name: string; label: string; options: { value: string; label: string }[]; params: URLSearchParams }) {
  const selected = new Set(selectedValues(params, name));
  return (
    <fieldset className="grid gap-2">
      <legend className="text-xs font-medium">{label}</legend>
      <div className="max-h-44 space-y-1 overflow-auto rounded-lg border border-border p-2">
        {options.length === 0 ? <p className="px-2 py-1 text-xs text-muted-foreground">Any</p> : null}
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 rounded-md px-2 py-1 text-xs">
            <input className="size-4 accent-primary" type="checkbox" name={name} value={option.value} defaultChecked={selected.has(option.value)} />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CompactParentSelect({ params }: { params: URLSearchParams }) {
  const parentFetchers = useParentCandidateFetchers("");
  useEffect(() => {
    parentFetchers.load();
  }, []);
  return (
    <CompactSelect
      name="parent"
      label="Parent"
      options={parentFetchers.candidates.map((candidate) => ({ value: String(candidate.id), label: candidate.lineage }))}
      params={params}
    />
  );
}

function useParentCandidateFetchers(query: string) {
  const topicFetcher = useFetcher<ParentPickerData>();
  const projectFetcher = useFetcher<ParentPickerData>();
  const taskFetcher = useFetcher<ParentPickerData>();
  const fetchers = [
    { type: "project", fetcher: topicFetcher },
    { type: "task", fetcher: projectFetcher },
    { type: "subtask", fetcher: taskFetcher },
  ] as const;
  return {
    candidates: fetchers.flatMap(({ fetcher }) => fetcher.data?.candidates ?? []),
    loading: fetchers.some(({ fetcher }) => fetcher.state !== "idle"),
    load: () => {
      fetchers.forEach(({ type, fetcher }) => {
        if (fetcher.state === "idle" && !fetcher.data) {
          fetcher.load(`/api/parents?type=${type}&q=${encodeURIComponent(query)}`);
        }
      });
    },
  };
}

function CompactDue({ params }: { params: URLSearchParams }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-xs font-medium">Due Date</legend>
      <Select name="due" defaultValue={params.get("due") ?? "any"}>
        {Object.entries(dueLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </Select>
      <Input type="date" name="from" aria-label="Due Date from" defaultValue={params.get("from") ?? ""} />
      <Input type="date" name="to" aria-label="Due Date to" defaultValue={params.get("to") ?? ""} />
    </fieldset>
  );
}

function Results({ rows, params, currentUserId }: { rows: SearchWorkItemRow[]; params: URLSearchParams; currentUserId: number }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card text-card-foreground lg:block">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="border-b border-border bg-muted text-muted-foreground">
            <tr>{tableSorts.map((sort) => <SortHeader key={sort} sort={sort} params={params} />)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => <ResultTableRow key={row.id} row={row} params={params} currentUserId={currentUserId} />)}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 lg:hidden">
        {rows.map((row) => <CompactResultRow key={row.id} row={row} params={params} currentUserId={currentUserId} />)}
      </div>
    </>
  );
}

function SortHeader({ sort, params }: { sort: SearchSort; params: URLSearchParams }) {
  const currentSort = (params.get("sort") ?? "id") as SearchSort;
  const currentDirection = (params.get("dir") ?? "asc") as SearchDirection;
  const nextDirection = currentSort === sort && currentDirection === "asc" ? "desc" : "asc";
  return (
    <th className="px-3 py-2 text-xs font-medium">
      <Link className="inline-flex items-center gap-1 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" to={searchHref(params, sort === "id" && nextDirection === "asc" ? { sort: [], dir: [] } : { sort: [sort], dir: [nextDirection] })}>
        {sortLabels[sort]} {currentSort === sort ? (currentDirection === "asc" ? "↑" : "↓") : null}
      </Link>
    </th>
  );
}

function ResultTableRow({ row, params, currentUserId }: { row: SearchWorkItemRow; params: URLSearchParams; currentUserId: number }) {
  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="px-3 py-2 text-xs text-muted-foreground">{row.id}</td>
      <td className="px-3 py-2 text-xs font-medium">
        <Link className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" to={`/search/${row.id}?${params.toString()}`}>
          <TypeMark type={row.type} />
          {row.summary}
        </Link>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">{row.parentSummary ?? "Top-level"}</td>
      <td className="px-3 py-2 text-xs text-muted-foreground"><Assignee row={row} currentUserId={currentUserId} /></td>
      <td className="px-3 py-2"><Badge>{statusLabels[row.status]}</Badge></td>
      <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(row.dueDate)}</td>
      <td className="px-3 py-2 text-xs text-muted-foreground">{formatTimestamp(row.updatedAt)}</td>
    </tr>
  );
}

function CompactResultRow({ row, params, currentUserId }: { row: SearchWorkItemRow; params: URLSearchParams; currentUserId: number }) {
  return (
    <Link className="relative block rounded-lg border border-border bg-card p-4 pr-14 text-card-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" to={`/search/${row.id}?${params.toString()}`}>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{row.parentSummary ?? "Top-level"}</span>
        <span>{formatDate(row.dueDate)}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm font-medium"><TypeMark type={row.type} /> {row.summary}</div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><StatusMark status={row.status} /> <Assignee row={row} currentUserId={currentUserId} /></div>
      <span className="absolute bottom-3 right-4 text-xs font-medium text-muted-foreground">#{row.id}</span>
    </Link>
  );
}

function Assignee({ row, currentUserId }: { row: SearchWorkItemRow; currentUserId: number }) {
  if (!row.assignee) return <span className="inline-flex items-center gap-1"><Avatar assignee={null} currentUserId={currentUserId} /> Unassigned</span>;
  return <Avatar assignee={row.assignee} currentUserId={currentUserId} withName />;
}

function selectedValues(params: URLSearchParams, name: string) {
  return params.getAll(name).flatMap((value) => value.split(",")).filter(Boolean);
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((candidate) => candidate !== value) : [...values, value];
}

function searchHref(params: URLSearchParams, changes: Record<string, string[]>) {
  const next = new URLSearchParams(params);
  for (const [name, values] of Object.entries(changes)) {
    next.delete(name);
    values.filter(Boolean).forEach((value) => next.append(name, value));
  }
  const query = next.toString();
  return query ? `/search?${query}` : "/search";
}

function searchPathFromForm(form: HTMLFormElement) {
  const formData = new FormData(form);
  const next = new URLSearchParams();
  const due = String(formData.get("due") ?? "any");
  for (const [name, value] of formData.entries()) {
    const text = String(value);
    if (text.length === 0) continue;
    if (name === "sort" && text === "id") continue;
    if (name === "dir" && text === "asc") continue;
    if (name === "due" && text === "any") continue;
    if ((name === "from" || name === "to") && !["before", "after", "between"].includes(due)) continue;
    if (name === "to" && due !== "between") continue;
    next.append(name, text);
  }
  const query = next.toString();
  return query ? `/search?${query}` : "/search";
}

function resultCountText(resultCount: number, _rowCount: number, limit: number) {
  if (resultCount > limit) {
    return `Showing ${limit.toLocaleString("en-US")} of ${resultCount.toLocaleString("en-US")} — narrow your search to see the rest.`;
  }
  return `${resultCount.toLocaleString("en-US")} ${resultCount === 1 ? "work item" : "work items"}`;
}

function activeFilterCount(params: URLSearchParams) {
  return ["type", "status", "who", "parent", "due", "from", "to", "labels"].filter((name) => {
    const value = params.get(name);
    return value !== null && value !== "" && !(name === "due" && value === "any");
  }).length;
}

function dueSummary(params: URLSearchParams) {
  const due = (params.get("due") ?? "any") as keyof typeof dueLabels;
  if (due === "before" || due === "after") return `${dueLabels[due]} ${formatDate(params.get("from"))}`;
  if (due === "between") return `Between ${formatDate(params.get("from"))} and ${formatDate(params.get("to"))}`;
  return dueLabels[due] ?? "Any";
}

function formatDate(date: string | null) {
  if (!date) return "No due date";
  return formatDueDate(date);
}

function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(new Date(timestamp));
}

function loadSelectedParents(database: DatabaseClient, parentIds: number[]): SelectedParent[] {
  const ids = [...new Set(parentIds.filter((id) => Number.isSafeInteger(id) && id > 0))];
  if (ids.length === 0) {
    return [];
  }
  return database.sqlite
    .prepare(`SELECT id, summary FROM work_items WHERE id IN (${ids.map(() => "?").join(", ")}) ORDER BY id`)
    .all(...ids) as SelectedParent[];
}

function useShellSearchData() {
  const shellMatch = useMatches().find((match) => match.id === "routes/shell");
  if (!shellMatch?.data) {
    return { members: [], labels: [] };
  }
  return shellMatch.data as ShellSearchData;
}
