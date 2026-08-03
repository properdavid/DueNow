import { useEffect, useRef, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { Link, useFetcher, useLocation, useMatches } from "react-router";
import { Check, X } from "lucide-react";

import { getDatabase, requireUser } from "~/auth/session.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "~/components/ui/menu";
import { Textarea } from "~/components/ui/textarea";
import { Avatar, StatusMark } from "~/components/ui/work-item-marks";
import type { WorkItemDetailReadModel, WorkItemsTreeMember } from "~/domain/work-items/work-items.server";
import { loadWorkItemDetail } from "~/domain/work-items/work-items.server";
import type { WorkItemStatus } from "~/db/schema";

type ShellData = {
  user: { id: number };
  members: (WorkItemsTreeMember & { theme?: "system" | "light" | "dark" })[];
};

type ActionResult = { ok: true } | { ok: false; error: { field?: string; message: string } };

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  await requireUser(request, context);
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Response("Work Item not found", { status: 404 });
  }
  return loadWorkItemDetail(getDatabase(context), id);
}

export default function WorkItem({ loaderData }: { loaderData: WorkItemDetailReadModel }) {
  const shellData = useShellData();
  return <WorkItemDocument currentUserId={shellData.user.id} detail={loaderData} members={shellData.members} />;
}

export function WorkItemDocument({
  currentUserId,
  detail,
  members,
}: {
  currentUserId: number;
  detail: WorkItemDetailReadModel;
  members: WorkItemsTreeMember[];
}) {
  const location = useLocation();
  const backLink = location.pathname.startsWith("/search/")
    ? { href: `/search${location.search}`, label: "← Back to results" }
    : location.pathname.startsWith("/due/")
      ? { href: "/due", label: "← Back to Due" }
      : location.pathname.startsWith("/items/")
        ? { href: "/items", label: "← Back to Work Items" }
        : null;

  return (
    <article className="min-h-screen bg-background p-6 text-foreground lg:min-h-full">
      <div className="mx-auto max-w-3xl space-y-6">
        {backLink ? (
          <Link
            className="inline-block text-sm text-muted-foreground"
            to={backLink.href}
          >
            {backLink.label}
          </Link>
        ) : null}
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          {detail.breadcrumb.map((crumb, index) => (
            <span key={`${crumb.id}-${index}`}>
              {index > 0 ? " › " : null}
              {index === detail.breadcrumb.length - 1 ? crumb.label : <Link to={`/items/${crumb.id}`}>{crumb.label}</Link>}
            </span>
          ))}
        </nav>
        <SummaryEditor id={detail.item.id} summary={detail.item.summary} />
        <div className="flex flex-wrap gap-2" aria-label="Property Chips">
          <StatusChip status={detail.item.status} />
          <AssigneeChip currentUserId={currentUserId} id={detail.item.id} assignee={detail.item.assignee} members={members} />
          <DueDateChip dueDate={detail.item.dueDate} id={detail.item.id} />
          <LabelsChip labels={detail.labels} />
        </div>
        <DescriptionEditor description={detail.item.description} id={detail.item.id} />
      </div>
    </article>
  );
}

function SummaryEditor({ id, summary }: { id: number; summary: string }) {
  return (
    <TextEditor
      action={`/api/work-items/${id}/update-summary`}
      fieldName="summary"
      initialValue={summary}
      label="Summary"
      multilineEnter={false}
      renderValue={(startEditing) => (
        <button className="block w-full rounded-md border border-transparent text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" type="button" onClick={startEditing}>
          <h1 className="text-xl font-semibold">{summary}</h1>
        </button>
      )}
      required
      textareaClassName="text-xl font-semibold"
      maxLength={200}
    />
  );
}

function DescriptionEditor({ id, description }: { id: number; description: string }) {
  return (
    <TextEditor
      action={`/api/work-items/${id}/update-description`}
      fieldName="description"
      initialValue={description}
      label="Description"
      multilineEnter
      renderValue={(startEditing) => (
        <button className="block w-full rounded-md border border-transparent text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" type="button" onClick={startEditing}>
          {description.trim().length > 0 ? <p className="whitespace-pre-wrap text-base">{description}</p> : <p className="text-sm text-muted-foreground">Add a Description</p>}
        </button>
      )}
    />
  );
}

function TextEditor({
  action,
  fieldName,
  initialValue,
  label,
  maxLength,
  multilineEnter,
  renderValue,
  required = false,
  textareaClassName,
}: {
  action: string;
  fieldName: string;
  initialValue: string;
  label: string;
  maxLength?: number;
  multilineEnter: boolean;
  renderValue: (startEditing: () => void) => React.ReactNode;
  required?: boolean;
  textareaClassName?: string;
}) {
  const fetcher = useFetcher<ActionResult>();
  const formRef = useRef<HTMLFormElement>(null);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const trimmed = value.trim();
  const error = fetcher.data?.ok === false ? fetcher.data.error.message : null;

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) {
      setEditing(false);
    }
  }, [fetcher.state, fetcher.data]);

  if (!editing) {
    return <section>{renderValue(() => setEditing(true))}</section>;
  }

  return (
    <section className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <fetcher.Form ref={formRef} method="post" action={action} className="space-y-2">
        <Textarea
          aria-label={label}
          className={textareaClassName}
          maxLength={maxLength}
          name={fieldName}
          rows={fieldName === "summary" ? 2 : 8}
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setValue(initialValue);
              setEditing(false);
            }
            if (!multilineEnter && event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (trimmed.length > 0) {
                formRef.current?.requestSubmit();
              }
            }
          }}
        />
        <div className="flex items-center gap-2">
          <Button aria-label={`Save ${label}`} disabled={fetcher.state !== "idle" || (required && trimmed.length === 0)} size="sm" type="submit" variant="outline">
            <Check aria-hidden="true" />
          </Button>
          <Button
            aria-label={`Discard ${label}`}
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => {
              setValue(initialValue);
              setEditing(false);
            }}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{controlErrorMessage(error)}</p> : null}
      </fetcher.Form>
    </section>
  );
}

function StatusChip({ status }: { status: WorkItemStatus }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-2 text-sm">
      <StatusMark status={status} />
      <span>Status: {statusLabel(status)}</span>
    </span>
  );
}

function AssigneeChip({
  assignee,
  currentUserId,
  id,
  members,
}: {
  assignee: WorkItemsTreeMember | null;
  currentUserId: number;
  id: number;
  members: WorkItemsTreeMember[];
}) {
  const fetcher = useFetcher<ActionResult>();
  const error = fetcher.data?.ok === false ? fetcher.data.error.message : null;
  return (
    <div>
      <Menu>
        <MenuTrigger asChild>
          <Button className="rounded-full" size="sm" type="button" variant="outline">
            <Avatar assignee={assignee} currentUserId={currentUserId} withName />
          </Button>
        </MenuTrigger>
        <MenuContent align="start">
          <MenuItem onSelect={() => submitAssignee(fetcher, id, null)}>
            <Avatar assignee={null} currentUserId={currentUserId} /> Unassigned
          </MenuItem>
          {members.map((member) => (
            <MenuItem key={member.id} onSelect={() => submitAssignee(fetcher, id, member.id)}>
              <Avatar assignee={member} currentUserId={currentUserId} /> {member.name}
            </MenuItem>
          ))}
        </MenuContent>
      </Menu>
      {error ? <p className="mt-1 text-sm text-destructive">{controlErrorMessage(error)}</p> : null}
    </div>
  );
}

function DueDateChip({ dueDate, id }: { dueDate: string | null; id: number }) {
  const fetcher = useFetcher<ActionResult>();
  const error = fetcher.data?.ok === false ? fetcher.data.error.message : null;

  return (
    <div>
      <Menu>
        <MenuTrigger asChild>
          <Button className="rounded-full" size="sm" type="button" variant="outline">
            Due Date: {dueDate ?? "No Due Date"}
          </Button>
        </MenuTrigger>
        <MenuContent align="start" className="space-y-2 p-2">
          <label className="block text-sm text-muted-foreground" htmlFor={`due-date-${id}`}>
            Due Date
          </label>
          <Input
            id={`due-date-${id}`}
            type="date"
            value={dueDate ?? ""}
            onChange={(event) => {
              submitDueDate(fetcher, id, event.currentTarget.value);
            }}
          />
          <Button className="w-full justify-start" size="sm" type="button" variant="ghost" onClick={() => submitDueDate(fetcher, id, "")}>
            Clear Due Date
          </Button>
        </MenuContent>
      </Menu>
      {error ? <p className="mt-1 text-sm text-destructive">{controlErrorMessage(error)}</p> : null}
    </div>
  );
}

function LabelsChip({ labels }: { labels: { id: number; name: string }[] }) {
  const labelNames = labels.length > 0 ? labels.map((label) => label.name).join(", ") : "No Labels";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-2 text-sm">
      <span>Labels: {labelNames}</span>
    </span>
  );
}

function submitAssignee(fetcher: ReturnType<typeof useFetcher<ActionResult>>, id: number, assigneeId: number | null) {
  const formData = new FormData();
  if (assigneeId !== null) formData.set("assigneeId", String(assigneeId));
  fetcher.submit(formData, { method: "post", action: `/api/work-items/${id}/assign` });
}

function submitDueDate(fetcher: ReturnType<typeof useFetcher<ActionResult>>, id: number, dueDate: string) {
  const formData = new FormData();
  formData.set("dueDate", dueDate);
  fetcher.submit(formData, { method: "post", action: `/api/work-items/${id}/update-due-date` });
}

function useShellData() {
  const shellMatch = useMatches().find((match) => match.id === "routes/shell");
  if (!shellMatch?.data) {
    throw new Error("Detail View requires shell loader data.");
  }
  return shellMatch.data as ShellData;
}

function statusLabel(status: WorkItemStatus) {
  return { open: "Open", in_progress: "In Progress", completed: "Completed", closed: "Closed" }[status];
}

function controlErrorMessage(message: string) {
  return message === "Try again." ? "Can't reach DueNow — Try again." : message;
}
