import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { describe, expect, test } from "vitest";

import { CreationDialogProvider } from "~/components/shell/creation-dialog";
import { WorkItemsTree } from "~/components/work-items/work-items-tree";
import {
  DUE_DATE_SLOT_PX,
  LIST_COLUMN_STACK_THRESHOLD_PX,
  treeRowIndentPx,
} from "~/components/work-items/tree-geometry";
import type { WorkItemsTreeRow } from "~/domain/work-items/work-items.server";

const user = { id: 1, email: "dana@example.com", name: "Dana", theme: "system" } as const;

function row(overrides: Partial<WorkItemsTreeRow> & Pick<WorkItemsTreeRow, "id" | "type" | "parentId" | "summary">): WorkItemsTreeRow {
  return { status: "open", dueDate: null, description: "", assigneeId: null, assignee: null, ...overrides };
}

function renderTree(rows: WorkItemsTreeRow[], selectedId: number | null = null, ancestorIds: number[] = []) {
  const Stub = createRoutesStub([
    {
      path: "/items/*",
      Component: () => (
        <CreationDialogProvider members={[user]} labels={[]}>
          <WorkItemsTree loaderData={{ rows, ancestorIds, selectedId, user, hasAnyWorkItems: rows.length > 0 }} />
        </CreationDialogProvider>
      ),
    },
  ]);
  return renderToStaticMarkup(<Stub initialEntries={[selectedId === null ? "/items" : `/items/${selectedId}`]} />);
}

describe("the tree row's width contract", () => {
  test("indents each rung by the geometry module's arithmetic rather than a spacing class", () => {
    const markup = renderTree(
      [
        row({ id: 1, type: "topic", parentId: null, summary: "Travel" }),
        row({ id: 2, type: "project", parentId: 1, summary: "San Diego Trip" }),
        row({ id: 3, type: "task", parentId: 2, summary: "Book lodging" }),
        row({ id: 4, type: "subtask", parentId: 3, summary: "Research Airbnbs" }),
      ],
      4,
      [1, 2, 3],
    );

    for (const level of [0, 1, 2, 3]) {
      expect(markup).toContain(`padding-left:${treeRowIndentPx(level)}px`);
    }
    expect(markup).not.toContain("pl-24");
  });

  test("prints a formatted due date, and reserves the slot when there is none", () => {
    const markup = renderTree([
      row({ id: 1, type: "topic", parentId: null, summary: "Travel", dueDate: "2026-08-10" }),
      row({ id: 2, type: "topic", parentId: null, summary: "House" }),
    ]);

    expect(markup).toContain("Aug 10");
    expect(markup).not.toContain(">2026-08-10<");
    expect(markup).toContain(`width:${DUE_DATE_SLOT_PX}px`);
  });
});

describe("the tree row's shape", () => {
  /* Tailwind reads class names out of the source, so the container query's
     threshold is written as a literal. This is what keeps it the same number the
     floor and the default were derived from. */
  const source = readFileSync(new URL("./work-items-tree.tsx", import.meta.url), "utf8");

  test("is selected by the column's own width, not the window's", () => {
    expect(source).toContain(`@min-[${LIST_COLUMN_STACK_THRESHOLD_PX}px]:flex`);
    expect(source).toContain(`@min-[${LIST_COLUMN_STACK_THRESHOLD_PX}px]:hidden`);
    expect(source).not.toContain("lg:hidden");
    expect(source).not.toContain("lg:flex");
  });
});
