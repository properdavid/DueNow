import { useEffect, useRef, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { Link, useFetcher, useLocation, useMatches } from "react-router";
import { Check, X } from "lucide-react";

import { getDatabase, requireUser } from "~/auth/session.server";
import { useCreationDialog } from "~/components/shell/creation-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "~/components/ui/menu";
import { Textarea } from "~/components/ui/textarea";
import { Avatar, StatusMark } from "~/components/ui/work-item-marks";
import { ReparentDialog } from "~/components/work-items/reparent-dialog";
import type { WorkItemCommentReadModel, WorkItemDetailChild, WorkItemDetailReadModel, WorkItemsTreeMember } from "~/domain/work-items/work-items.server";
import { loadWorkItemDetail } from "~/domain/work-items/work-items.server";
import type { WorkItemStatus, WorkItemType } from "~/db/schema";

type ShellData = {
  user: { id: number };
  members: (WorkItemsTreeMember & { theme?: "system" | "light" | "dark" })[];
  labels: { id: number; name: string }[];
};

type ActionResult = { ok: true; changed?: number } | { ok: false; error: { field?: string; message: string } };

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
  return <WorkItemDocument currentUserId={shellData.user.id} detail={loaderData} labelVocabulary={shellData.labels} members={shellData.members} />;
}

export function WorkItemDocument({
  currentUserId,
  detail,
  labelVocabulary,
  members,
}: {
  currentUserId: number;
  detail: WorkItemDetailReadModel;
  labelVocabulary: { id: number; name: string }[];
  members: WorkItemsTreeMember[];
}) {
  const location = useLocation();
  const [reparentOpen, setReparentOpen] = useState(false);
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
        {detail.item.parentId !== null ? (
          <div>
            <Button size="sm" type="button" variant="outline" onClick={() => setReparentOpen(true)}>
              Reparent…
            </Button>
            <ReparentDialog
              currentParentId={detail.item.parentId}
              itemId={detail.item.id}
              itemSummary={detail.item.summary}
              itemType={detail.item.type}
              open={reparentOpen}
              onOpenChange={setReparentOpen}
            />
          </div>
        ) : null}
        <SummaryEditor id={detail.item.id} summary={detail.item.summary} />
        <div className="flex flex-wrap gap-2" aria-label="Property Chips">
          <StatusChip
            id={detail.item.id}
            reopenNotice={detail.reopenNotice}
            status={detail.item.status}
            startCascadeAncestors={detail.startCascadeAncestors}
            unfinishedDescendants={detail.unfinishedDescendants}
          />
          <AssigneeChip currentUserId={currentUserId} id={detail.item.id} assignee={detail.item.assignee} members={members} />
          <DueDateChip dueDate={detail.item.dueDate} id={detail.item.id} />
          <LabelsChip id={detail.item.id} labels={detail.labels} vocabulary={labelVocabulary} />
        </div>
        <DescriptionEditor description={detail.item.description} id={detail.item.id} />
        <ChildrenChecklist
          childrenRows={detail.children}
          currentUserId={currentUserId}
          parentId={detail.item.id}
          parentSummary={detail.item.summary}
          parentType={detail.item.type}
        />
        <CommentsSection comments={detail.comments} currentUserId={currentUserId} workItemId={detail.item.id} />
      </div>
    </article>
  );
}

function CommentsSection({
  comments,
  currentUserId,
  workItemId,
}: {
  comments: WorkItemCommentReadModel[];
  currentUserId: number;
  workItemId: number;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Comments</h2>
        {comments.length === 0 ? <p className="text-sm text-muted-foreground">No Comments yet.</p> : null}
      </div>
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentRow key={comment.id} comment={comment} currentUserId={currentUserId} />
        ))}
      </div>
      <CommentComposer workItemId={workItemId} />
    </section>
  );
}

function CommentRow({ comment, currentUserId }: { comment: WorkItemCommentReadModel; currentUserId: number }) {
  const editFetcher = useFetcher<ActionResult>();
  const deleteFetcher = useFetcher<ActionResult>();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const pendingDelete = deleteFetcher.state !== "idle";
  const editError = editFetcher.data?.ok === false ? editFetcher.data.error.message : null;
  const deleteError = deleteFetcher.data?.ok === false ? deleteFetcher.data.error.message : null;
  const isOwnComment = comment.author.id === currentUserId;

  useEffect(() => {
    setBody(comment.body);
  }, [comment.body]);

  useEffect(() => {
    if (editFetcher.state === "idle" && editFetcher.data?.ok) {
      setEditing(false);
    }
  }, [editFetcher.state, editFetcher.data]);

  useEffect(() => {
    if (deleteFetcher.state === "idle" && deleteFetcher.data?.ok) {
      setConfirmingDelete(false);
    }
  }, [deleteFetcher.state, deleteFetcher.data]);

  return (
    <article className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <div className="flex items-start gap-3">
        <Avatar assignee={comment.author} currentUserId={currentUserId} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{comment.author.name}</span>
            <span>{relativeTime(comment.createdAt)}</span>
            {comment.edited ? <span>· edited</span> : null}
            {isOwnComment ? (
              confirmingDelete ? (
                <span className="inline-flex items-center gap-2">
                  <span>Delete?</span>
                  <Button disabled={pendingDelete} size="sm" type="button" variant="ghost" onClick={() => submitDeleteComment(deleteFetcher, comment.id)}>
                    Yes
                  </Button>
                  <Button disabled={pendingDelete} size="sm" type="button" variant="ghost" onClick={() => setConfirmingDelete(false)}>
                    No
                  </Button>
                </span>
              ) : (
                <>
                  <Button size="sm" type="button" variant="ghost" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                  <Button disabled={pendingDelete} size="sm" type="button" variant="ghost" onClick={() => setConfirmingDelete(true)}>
                    Delete
                  </Button>
                </>
              )
            ) : null}
          </div>
          {editing ? (
            <editFetcher.Form method="post" action={`/api/comments/${comment.id}/edit`} className="space-y-2">
              <Textarea
                aria-label="Comment"
                name="body"
                rows={4}
                value={body}
                onChange={(event) => setBody(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setBody(comment.body);
                    setEditing(false);
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <Button aria-label="Save Comment" disabled={editFetcher.state !== "idle"} size="sm" type="submit" variant="outline">
                  <Check aria-hidden="true" />
                </Button>
                <Button
                  aria-label="Discard Comment"
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setBody(comment.body);
                    setEditing(false);
                  }}
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
              {editError ? <p className="text-sm text-destructive">{controlErrorMessage(editError)}</p> : null}
            </editFetcher.Form>
          ) : (
            <p className="whitespace-pre-wrap text-base">{comment.body}</p>
          )}
          {deleteError ? <p className="text-sm text-destructive">{controlErrorMessage(deleteError)}</p> : null}
        </div>
      </div>
    </article>
  );
}

function CommentComposer({ workItemId }: { workItemId: number }) {
  const fetcher = useFetcher<ActionResult>();
  const [value, setValue] = useState("");
  const error = fetcher.data?.ok === false ? fetcher.data.error.message : null;

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) {
      setValue("");
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <fetcher.Form method="post" action={`/api/work-items/${workItemId}/add-comment`} className="space-y-2 rounded-lg border border-border bg-card p-4 text-card-foreground">
      <label className="block text-sm font-medium text-muted-foreground" htmlFor={`comment-body-${workItemId}`}>
        Add Comment
      </label>
      <Textarea
        id={`comment-body-${workItemId}`}
        name="body"
        rows={4}
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setValue("");
          }
        }}
      />
      <div className="flex items-center gap-2">
        <Button aria-label="Save Comment" disabled={fetcher.state !== "idle"} size="sm" type="submit" variant="outline">
          <Check aria-hidden="true" />
        </Button>
        <Button aria-label="Discard Comment" size="sm" type="button" variant="ghost" onClick={() => setValue("")}>
          <X aria-hidden="true" />
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{controlErrorMessage(error)}</p> : null}
    </fetcher.Form>
  );
}

function ChildrenChecklist({
  childrenRows,
  currentUserId,
  parentId,
  parentSummary,
  parentType,
}: {
  childrenRows: WorkItemDetailChild[];
  currentUserId: number;
  parentId: number;
  parentSummary: string;
  parentType: WorkItemType;
}) {
  const childType = childTypeFor(parentType);
  const { openCreationDialog } = useCreationDialog();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [parentId]);

  if (childType === null) {
    return null;
  }

  const unfinished = childrenRows.filter((child) => !isTerminalStatus(child.status));
  const settled = childrenRows.filter((child) => isTerminalStatus(child.status));
  const visibleRows = revealed ? childrenRows : unfinished;
  const childLabel = typeLabel(childType);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{childLabel}s</h2>
      {childrenRows.length === 0 ? (
        <div className="rounded-lg border border-border bg-card text-card-foreground">
          <p className="p-4 text-sm text-muted-foreground">No {childLabel}s yet.</p>
        </div>
      ) : visibleRows.length > 0 ? (
        <div className="rounded-lg border border-border bg-card text-card-foreground">
          <div className="divide-y divide-border">
            {visibleRows.map((child) => (
              <ChildrenChecklistRow key={child.id} child={child} currentUserId={currentUserId} />
            ))}
          </div>
        </div>
      ) : null}
      {settled.length > 0 && !revealed ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{settled.length} settled —</span>
          <Button size="sm" type="button" variant="ghost" onClick={() => setRevealed(true)}>
            show
          </Button>
        </div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        onClick={() => openCreationDialog({ type: childType, parentId, parentSummary, stayOnSuccess: true })}
      >
        Add {childLabel}
      </Button>
    </section>
  );
}

function ChildrenChecklistRow({ child, currentUserId }: { child: WorkItemDetailChild; currentUserId: number }) {
  const fetcher = useFetcher<ActionResult>();
  const [confirmSettle, setConfirmSettle] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const pending = fetcher.state !== "idle";
  const error = fetcher.data?.ok === false ? fetcher.data.error.message : null;

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) {
      setConfirmSettle(false);
      setConfirmReopen(false);
    }
  }, [fetcher.state, fetcher.data]);

  function toggle() {
    if (isTerminalStatus(child.status)) {
      if (child.reopenNotice.length > 0) {
        setConfirmReopen(true);
        return;
      }
      submitStatus(fetcher, child.id, "open", false);
      return;
    }
    if (child.unfinishedDescendants.length > 0) {
      setConfirmSettle(true);
      return;
    }
    submitStatus(fetcher, child.id, "completed", false);
  }

  return (
    <div className="p-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          aria-label={isTerminalStatus(child.status) ? `Un-settle ${child.summary}` : `Complete ${child.summary}`}
          className="p-0"
          disabled={pending}
          size="icon"
          type="button"
          variant="ghost"
          onClick={toggle}
        >
          <StatusMark status={child.status} />
        </Button>
        <Link className={`min-w-0 flex-1 text-base font-medium ${isTerminalStatus(child.status) ? "text-muted-foreground line-through" : ""}`} to={`/items/${child.id}`}>
          {child.summary}
        </Link>
        <span className="text-sm text-muted-foreground">{child.dueDate ?? "No Due Date"}</span>
        <Avatar assignee={child.assignee} currentUserId={currentUserId} withName />
      </div>
      {confirmSettle ? (
        <ChecklistNotice
          title={`Settle ${child.unfinishedDescendants.length} ${child.unfinishedDescendants.length === 1 ? "descendant" : "descendants"} as Completed?`}
          body="The Settle Cascade will sweep every Unfinished descendant named here."
          items={child.unfinishedDescendants.map((descendant) => descendant.summary)}
          pending={pending}
          confirmLabel="Confirm"
          onCancel={() => setConfirmSettle(false)}
          onConfirm={() => submitStatus(fetcher, child.id, "completed", true)}
        />
      ) : null}
      {confirmReopen ? (
        <ChecklistNotice
          title="Reopen Notice"
          body={`Un-settling will move ${formatSummaryList(child.reopenNotice.map((item) => item.summary))} to In Progress.`}
          items={[]}
          pending={pending}
          confirmLabel="Un-settle"
          onCancel={() => setConfirmReopen(false)}
          onConfirm={() => submitStatus(fetcher, child.id, "open", true)}
        />
      ) : null}
      {error ? <p className="mt-2 text-sm text-destructive">{controlErrorMessage(error)}</p> : null}
    </div>
  );
}

function ChecklistNotice({
  body,
  confirmLabel,
  items,
  onCancel,
  onConfirm,
  pending,
  title,
}: {
  body: string;
  confirmLabel: string;
  items: string[];
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
}) {
  return (
    <div className="mt-3 space-y-3 rounded-lg border border-border bg-popover p-3 text-popover-foreground">
      <div className="space-y-1">
        <p className="text-base font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
      {items.length > 0 ? (
        <ul className="max-h-56 space-y-1 overflow-auto text-sm">
          {items.map((item) => (
            <li key={item} className="rounded-md border border-border bg-muted px-2 py-1">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex items-center gap-2">
        <Button disabled={pending} size="sm" type="button" variant="outline" onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button disabled={pending} size="sm" type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
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

function StatusChip({
  id,
  reopenNotice,
  status,
  startCascadeAncestors,
  unfinishedDescendants,
}: {
  id: number;
  reopenNotice: { id: number; summary: string; status: WorkItemStatus }[];
  status: WorkItemStatus;
  startCascadeAncestors: { id: number; summary: string }[];
  unfinishedDescendants: { id: number; summary: string; type: string }[];
}) {
  const fetcher = useFetcher<ActionResult>();
  const [open, setOpen] = useState(false);
  const [confirmingStatus, setConfirmingStatus] = useState<WorkItemStatus | null>(null);
  const [confirmingReopen, setConfirmingReopen] = useState(false);
  const error = fetcher.data?.ok === false ? fetcher.data.error.message : null;
  const pending = fetcher.state !== "idle";
  const settleCount = unfinishedDescendants.length;

  const chooseStatus = (nextStatus: WorkItemStatus) => {
    if (nextStatus === "open" && reopenNotice.length > 0) {
      setConfirmingReopen(true);
      return;
    }
    if (isTerminalStatus(nextStatus) && settleCount > 0) {
      setConfirmingStatus(nextStatus);
      return;
    }
    submitStatus(fetcher, id, nextStatus, false);
    setOpen(false);
  };

  return (
    <div>
      <Menu open={open} onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setConfirmingStatus(null);
          setConfirmingReopen(false);
        }
      }}>
        <MenuTrigger asChild>
          <Button className="rounded-full" size="sm" type="button" variant="outline">
            <StatusMark status={status} />
            Status: {statusLabel(status)}
          </Button>
        </MenuTrigger>
        <MenuContent align="start" className="w-80">
          {confirmingReopen ? (
            <div className="space-y-3 p-2">
              <div className="space-y-1">
                <p className="text-base font-semibold">Reopen Notice</p>
                <p className="text-sm text-muted-foreground">
                  Changing this Work Item to Open will move {formatSummaryList(reopenNotice.map((item) => item.summary))} to In Progress.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button disabled={pending} size="sm" type="button" variant="outline" onClick={() => {
                  submitStatus(fetcher, id, "open", true);
                  setOpen(false);
                }}>
                  Confirm
                </Button>
                <Button disabled={pending} size="sm" type="button" variant="ghost" onClick={() => setConfirmingReopen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : confirmingStatus ? (
            <div className="space-y-3 p-2">
              <div className="space-y-1">
                <p className="text-base font-semibold">
                  Settle {settleCount} {settleCount === 1 ? "descendant" : "descendants"} as {statusLabel(confirmingStatus)}?
                </p>
                <p className="text-sm text-muted-foreground">The Settle Cascade will sweep every Unfinished descendant named here.</p>
              </div>
              <ul className="max-h-56 space-y-1 overflow-auto text-sm">
                {unfinishedDescendants.map((descendant) => (
                  <li key={descendant.id} className="rounded-md border border-border bg-muted px-2 py-1">
                    {descendant.summary}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2">
                <Button disabled={pending} size="sm" type="button" variant="outline" onClick={() => {
                  submitStatus(fetcher, id, confirmingStatus, true);
                  setOpen(false);
                }}>
                  Confirm
                </Button>
                <Button disabled={pending} size="sm" type="button" variant="ghost" onClick={() => setConfirmingStatus(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {(["open", "in_progress", "completed", "closed"] as const).map((option) => (
                <MenuItem
                  key={option}
                  disabled={pending || option === status}
                  onSelect={(event) => {
                    if ((isTerminalStatus(option) && settleCount > 0) || (option === "open" && reopenNotice.length > 0)) event.preventDefault();
                    chooseStatus(option);
                  }}
                >
                  <StatusMark status={option} /> {statusLabel(option)}
                </MenuItem>
              ))}
              {startCascadeAncestors.length > 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  Starting this Work Item will also start {formatSummaryList(startCascadeAncestors.map((ancestor) => ancestor.summary))}.
                </p>
              ) : null}
            </>
          )}
        </MenuContent>
      </Menu>
      {error ? <p className="mt-1 text-sm text-destructive">{controlErrorMessage(error)}</p> : null}
    </div>
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

function LabelsChip({
  id,
  labels,
  vocabulary,
}: {
  id: number;
  labels: { id: number; name: string }[];
  vocabulary: { id: number; name: string }[];
}) {
  const mutationFetcher = useFetcher<ActionResult>();
  const createFetcher = useFetcher<ActionResult>();
  const [newLabelName, setNewLabelName] = useState("");
  const selectedIds = new Set(labels.map((label) => label.id));
  const mutationError = mutationFetcher.data?.ok === false ? mutationFetcher.data.error.message : null;
  const createError = createFetcher.data?.ok === false ? createFetcher.data.error.message : null;
  const pending = mutationFetcher.state !== "idle" || createFetcher.state !== "idle";

  useEffect(() => {
    if (createFetcher.state === "idle" && createFetcher.data?.ok) {
      setNewLabelName("");
    }
  }, [createFetcher.state, createFetcher.data]);

  return (
    <div>
      <Menu>
        <MenuTrigger asChild>
          <Button className="max-w-full rounded-full whitespace-normal text-left" type="button" variant="outline">
            <span>Labels:</span>
            {labels.length > 0 ? (
              <span className="flex flex-wrap gap-1">
                {labels.map((label) => (
                  <Badge key={label.id} variant="chip">{label.name}</Badge>
                ))}
              </span>
            ) : (
              <span>No Labels</span>
            )}
          </Button>
        </MenuTrigger>
        <MenuContent align="start" className="w-80 space-y-2 p-2">
          <div className="space-y-1">
            {vocabulary.length > 0 ? (
              vocabulary.map((label) => {
                const selected = selectedIds.has(label.id);
                return (
                  <MenuItem
                    key={label.id}
                    disabled={pending}
                    onSelect={(event) => {
                      event.preventDefault();
                      submitLabelToggle(mutationFetcher, id, label.id, selected);
                    }}
                  >
                    <span className="inline-flex size-4 items-center justify-center">
                      {selected ? <Check aria-hidden="true" /> : null}
                    </span>
                    {label.name}
                  </MenuItem>
                );
              })
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">No Labels yet.</p>
            )}
          </div>
          <createFetcher.Form method="post" action={`/api/work-items/${id}/create-label`} className="space-y-2 border-t border-border pt-2">
            <label className="block text-sm text-muted-foreground" htmlFor={`label-name-${id}`}>
              Create Label
            </label>
            <div className="flex gap-2">
              <Input
                id={`label-name-${id}`}
                maxLength={30}
                name="name"
                placeholder="Label name"
                value={newLabelName}
                onChange={(event) => setNewLabelName(event.currentTarget.value)}
              />
              <Button disabled={pending || newLabelName.trim().length === 0} size="sm" type="submit" variant="outline">
                Add
              </Button>
            </div>
          </createFetcher.Form>
        </MenuContent>
      </Menu>
      {mutationError ? <p className="mt-1 text-sm text-destructive">{controlErrorMessage(mutationError)}</p> : null}
      {createError ? <p className="mt-1 text-sm text-destructive">{controlErrorMessage(createError)}</p> : null}
    </div>
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

function submitLabelToggle(fetcher: ReturnType<typeof useFetcher<ActionResult>>, id: number, labelId: number, selected: boolean) {
  const formData = new FormData();
  formData.set("labelId", String(labelId));
  fetcher.submit(formData, { method: "post", action: `/api/work-items/${id}/${selected ? "detach-label" : "attach-label"}` });
}

function submitDeleteComment(fetcher: ReturnType<typeof useFetcher<ActionResult>>, commentId: number) {
  fetcher.submit(new FormData(), { method: "post", action: `/api/comments/${commentId}/delete` });
}

function submitStatus(fetcher: ReturnType<typeof useFetcher<ActionResult>>, id: number, status: WorkItemStatus, confirmed: boolean) {
  const formData = new FormData();
  formData.set("id", String(id));
  formData.set("status", status);
  formData.set("confirmed", String(confirmed));
  const action = status === "in_progress" ? "start" : status === "open" ? "unsettle" : "settle";
  fetcher.submit(formData, { method: "post", action: `/api/work-items/${id}/${action}` });
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

function isTerminalStatus(status: WorkItemStatus) {
  return status === "completed" || status === "closed";
}

function childTypeFor(type: WorkItemType) {
  return { topic: "project", project: "task", task: "subtask", subtask: null }[type] as WorkItemType | null;
}

function typeLabel(type: WorkItemType) {
  return { topic: "Topic", project: "Project", task: "Task", subtask: "Subtask" }[type];
}

function formatSummaryList(summaries: string[]) {
  if (summaries.length <= 1) return summaries[0] ?? "";
  if (summaries.length === 2) return `${summaries[0]} and ${summaries[1]}`;
  return `${summaries.slice(0, -1).join(", ")}, and ${summaries[summaries.length - 1]}`;
}

function controlErrorMessage(message: string) {
  return message === "Try again." ? "Can't reach DueNow — Try again." : message;
}

function relativeTime(createdAt: number, now = Date.now()) {
  const elapsed = Math.max(0, now - createdAt);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (elapsed < minute) return "just now";
  if (elapsed < hour) return pluralize(Math.floor(elapsed / minute), "minute");
  if (elapsed < day) return pluralize(Math.floor(elapsed / hour), "hour");
  return pluralize(Math.floor(elapsed / day), "day");
}

function pluralize(value: number, unit: string) {
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}
