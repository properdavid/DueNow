import { Check, Diamond, Square, Star, Triangle } from "lucide-react";

import type { WorkItemStatus, WorkItemType } from "~/db/schema";

export function TypeMark({ type }: { type: WorkItemType }) {
  const Icon = { topic: Star, project: Diamond, task: Square, subtask: Triangle }[type];
  const className = {
    topic: "text-type-topic",
    project: "text-type-project",
    task: "text-type-task",
    subtask: "text-type-subtask",
  }[type];
  return <span aria-label={`${type} Type Mark`} className={`inline-flex items-center justify-center [&_svg]:size-4 [&_svg]:shrink-0 ${className}`}><Icon aria-hidden="true" /></span>;
}

export function StatusMark({ status }: { status: WorkItemStatus }) {
  if (status === "open") return <span aria-label="Open Status Mark" className="inline-block size-4 rounded-full border border-status-open" />;
  if (status === "in_progress") {
    return (
      <span aria-label="In Progress Status Mark" className="inline-flex size-4 overflow-hidden rounded-full border border-status-in-progress">
        <span className="h-full w-1/2 bg-status-in-progress" />
      </span>
    );
  }
  if (status === "completed") {
    return <span aria-label="Completed Status Mark" className="inline-flex size-4 items-center justify-center text-status-completed [&_svg]:size-4 [&_svg]:shrink-0"><Check aria-hidden="true" /></span>;
  }
  return <span aria-label="Closed Status Mark" className="inline-block size-4 rounded-full bg-status-closed" />;
}

export function Avatar({ assignee, currentUserId, withName = false }: { assignee: { id: number; name: string; email: string } | null; currentUserId: number; withName?: boolean }) {
  if (!assignee) {
    return <span aria-label="Unassigned" className="inline-flex size-7 items-center justify-center rounded-full border border-dashed border-muted-foreground" />;
  }
  const initial = (assignee.name.trim()[0] ?? assignee.email.trim()[0] ?? "?").toUpperCase();
  const mine = assignee.id === currentUserId;
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-flex size-7 items-center justify-center rounded-full text-[10px] font-bold uppercase tracking-wide ${mine ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"}`}>
        {initial}
      </span>
      {withName ? <span>{assignee.name}</span> : null}
    </span>
  );
}
