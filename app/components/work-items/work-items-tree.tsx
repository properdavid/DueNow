import { useEffect, useMemo, useState } from "react";
import { Link, useFetcher, useLocation } from "react-router";
import { Check, ChevronDown, ChevronRight, ListTree, MoreHorizontal, Play } from "lucide-react";

import type { AuthUser } from "~/auth/session.server";
import { EmptyCard } from "~/components/shell/empty-card";
import { useCreationDialog } from "~/components/shell/creation-dialog";
import { Button } from "~/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "~/components/ui/menu";
import { Avatar, StatusMark, TypeMark } from "~/components/ui/work-item-marks";
import type { WorkItemsTreeReadModel, WorkItemsTreeRow } from "~/domain/work-items/work-items.server";
import { expandableRowIds, isTerminalStatus, rootIsAllSettled, rootRows, terminalParentIdsInPath, workItemsTreeLines } from "~/domain/work-items/tree-view";

export type ItemsLoaderData = WorkItemsTreeReadModel & { user: AuthUser };

export function WorkItemsTree({ loaderData }: { loaderData: ItemsLoaderData }) {
  const location = useLocation();
  const { rows, ancestorIds, selectedId, user, hasAnyWorkItems } = loaderData;
  const selectedPath = selectedId === null ? new Set<number>() : new Set([...ancestorIds, selectedId]);
  const [expandedIds, setExpandedIds] = useState(() => new Set(ancestorIds));
  const [revealedParents, setRevealedParents] = useState(() => new Set<number | null>(terminalParentIdsInPath(rows, selectedPath)));
  const topLevelRows = useMemo(() => rootRows(rows), [rows]);
  const allSettled = rootIsAllSettled(topLevelRows, hasAnyWorkItems);
  const treeLines = useMemo(() => workItemsTreeLines(rows, { expandedIds, revealedParents }), [rows, expandedIds, revealedParents]);

  useEffect(() => {
    setExpandedIds(new Set(selectedId === null ? [] : ancestorIds));
    setRevealedParents((current) => {
      if (selectedId === null) return current;
      const next = new Set(current);
      for (const parentId of terminalParentIdsInPath(rows, selectedPath)) next.add(parentId);
      return next;
    });
  }, [selectedId]);

  function toggleExpanded(id: number) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reveal(parentId: number | null) {
    setRevealedParents((current) => new Set(current).add(parentId));
  }

  const allExpandableIds = expandableRowIds(rows);

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold">Work Items</h1>
          <p className="mt-1 text-sm text-muted-foreground">The full Type Ladder for the household.</p>
        </div>
        {hasAnyWorkItems ? (
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => setExpandedIds(new Set())}>
              Collapse all
            </Button>
            <Button variant="outline" type="button" onClick={() => setExpandedIds(new Set(allExpandableIds))}>
              Expand all
            </Button>
          </div>
        ) : null}
      </div>

      {!hasAnyWorkItems ? (
        <div className="flex min-h-96 items-center justify-center">
          <EmptyCard headline="Nothing here yet" line="Start with a Topic — a standing area of household life, like House or Travel. Projects, Tasks and Subtasks hang off it." Mark={ListTree} />
        </div>
      ) : allSettled && !revealedParents.has(null) ? (
        <div className="flex min-h-96 items-center justify-center">
          <EmptyCard
            headingLevel="h2"
            headline="All settled"
            line="Nothing is unfinished. Everything either of you has created has been completed or closed."
            Mark={Check}
          >
            <Button className="mt-4" variant="outline" type="button" onClick={() => reveal(null)}>
              Show {topLevelRows.length} settled
            </Button>
          </EmptyCard>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-border bg-card text-card-foreground">
          <div className="divide-y divide-border">
            {treeLines.map((line) =>
              line.kind === "row" ? (
                <TreeRow
                  key={`row-${line.row.id}`}
                  currentUserId={user.id}
                  settledCount={line.settledCount}
                  hasChildren={line.hasChildren}
                  isExpanded={line.isExpanded}
                  isSelected={selectedId === line.row.id}
                  level={line.level}
                  returnTo={`${location.pathname}${location.search}`}
                  row={line.row}
                  toggleExpanded={toggleExpanded}
                />
              ) : (
                <SettledRevealLine key={`settled-${line.parentId ?? "root"}`} count={line.count} level={line.level} parentId={line.parentId} reveal={reveal} />
              ),
            )}          </div>
        </div>
      )}
    </div>
  );
}

function SettledRevealLine({ parentId, level, count, reveal }: { parentId: number | null; level: number; count: number; reveal: (parentId: number | null) => void }) {
  return (
    <div className={`flex items-center gap-2 py-2 pr-4 text-sm text-muted-foreground ${indentClass(level)}`}>
      <span>{count} settled —</span>
      <Button variant="ghost" size="sm" type="button" onClick={() => reveal(parentId)}>
        show
      </Button>
    </div>
  );
}

function TreeRow({
  row,
  level,
  hasChildren,
  isExpanded,
  isSelected,
  settledCount,
  currentUserId,
  returnTo,
  toggleExpanded,
}: {
  row: WorkItemsTreeRow;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  settledCount: number;
  currentUserId: number;
  returnTo: string;
  toggleExpanded: (id: number) => void;
}) {
  const terminal = isTerminalStatus(row.status);
  return (
    <div
      className={`group flex flex-col gap-1 py-3 pr-4 ${indentClass(level)} ${isSelected ? "bg-accent text-accent-foreground" : ""} ${terminal ? "text-muted-foreground line-through" : ""}`}
    >
      <div className="flex items-center gap-2">
        {hasChildren ? (
          <Button
            aria-label={isExpanded ? `Collapse ${row.summary}` : `Expand ${row.summary}`}
            className="p-0 text-muted-foreground"
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => toggleExpanded(row.id)}
          >
            {isExpanded ? <ChevronDown aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
          </Button>
        ) : (
          <span className="size-6" />
        )}
        <TypeMark type={row.type} />
        <Button asChild className="min-w-0 flex-1 justify-start truncate px-0 text-base font-medium" variant="ghost">
          <Link to={`/items/${row.id}`}>{row.summary}</Link>
        </Button>
        {settledCount > 0 ? <span className="rounded-md border border-border bg-muted px-2 py-0 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{settledCount} settled</span> : null}
        <div className="hidden items-center gap-3 lg:flex">
          <StatusMark status={row.status} />
          <Avatar assignee={row.assignee} currentUserId={currentUserId} />
          {row.dueDate ? <DueDate dueDate={row.dueDate} /> : <span className="w-20" />}
        </div>
        <RowMenu row={row} returnTo={returnTo} />
      </div>
      <div className="ml-16 flex flex-wrap items-center gap-2 text-sm text-muted-foreground lg:hidden">
        <StatusMark status={row.status} />
        {row.assignee ? <Avatar assignee={row.assignee} currentUserId={currentUserId} withName /> : <Avatar assignee={null} currentUserId={currentUserId} />}
        {row.dueDate ? <DueDate dueDate={row.dueDate} /> : null}
      </div>
    </div>
  );
}

function RowMenu({ row, returnTo }: { row: WorkItemsTreeRow; returnTo: string }) {
  const fetcher = useFetcher();
  const { openCreationDialog } = useCreationDialog();
  const canStart = row.status === "open";
  const isStarting = fetcher.state !== "idle";
  const childType = childTypeFor(row.type);
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button aria-label={`Open row menu for ${row.summary}`} variant="ghost" size="icon" type="button">
        <MoreHorizontal aria-hidden="true" />
        </Button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem
          disabled={childType === null}
          onSelect={() => {
            if (childType) {
              openCreationDialog({ type: childType, parentId: row.id, parentSummary: row.summary });
            }
          }}
        >
          Add child
        </MenuItem>
        <MenuItem disabled>Move…</MenuItem>
        <fetcher.Form method="post" action={`/api/work-items/${row.id}/start?returnTo=${encodeURIComponent(returnTo)}`}>
          <MenuItem asChild disabled={!canStart || isStarting}>
            <button type="submit">
              <Play aria-hidden="true" /> {isStarting ? "Starting" : "Start"}
            </button>
          </MenuItem>
        </fetcher.Form>
      </MenuContent>
    </Menu>
  );
}

function childTypeFor(type: WorkItemsTreeRow["type"]) {
  return { topic: "project", project: "task", task: "subtask", subtask: null }[type] as WorkItemsTreeRow["type"] | null;
}

function DueDate({ dueDate }: { dueDate: string }) {
  return <time className="text-sm text-muted-foreground" dateTime={dueDate}>{dueDate}</time>;
}

function indentClass(level: number) {
  return ["pl-4", "pl-10", "pl-16", "pl-24"][level] ?? "pl-24";
}
