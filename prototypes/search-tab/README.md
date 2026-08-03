# Search tab prototype — THROWAWAY

Primary source for [#18](https://github.com/properdavid/DueNow/issues/18): what the
Search tab actually looks like. **Do not merge into `main`, and do not lift this code
into the app** — prototype rules: no tests, no error handling, no abstractions, tokens
eyeballed.

```
npm install
npm run dev     # http://localhost:5181
```

## Reading it

The black strip switches variants (arrow keys work), reports **compact** or **split**
([ADR-0017](../../docs/adr/0017-the-navigation-shell-is-two-layouts-and-one-breakpoint.md)'s
one breakpoint at 1024px), and carries a **full / sparse / empty** data control — `empty`
is an empty *corpus*, which is a different screen from a query with no hits.

The shell, the tree ([ADR-0018](../../docs/adr/0018-the-work-items-tree-is-a-full-outline.md)),
the detail view ([ADR-0019](../../docs/adr/0019-the-work-item-detail-view-is-one-editable-document.md))
and the Due tab ([ADR-0020](../../docs/adr/0020-the-due-tab-is-a-card-list-read-at-a-glance.md), the
Radar cards) are held **fixed**; only the Search tab swaps, and it owns its whole pane —
header, filter surface, sort control and empty states included, because all four are part
of #18's question.

| | |
| --- | --- |
| `?variant=A` | **Table.** Takes [ADR-0012](../../docs/adr/0012-search-is-a-read-only-filtered-flat-list.md)'s "table on desktop with sortable headers" literally, and takes the width to pay for it: on desktop Search **overrides the split** and owns the whole pane, with a work item opening as a push behind *← Back to results*. Seven columns (`#`, Summary, Parent, Assignee, Status, Due, Updated); only `#`, Due and Updated are clickable headers. Filters are a bar of six dropdowns whose **labels carry their own state** (`Type: Task, Subtask`) — no chip row, because a chip row would print the same thing twice. Keyword sits inline with the title and **submits on Enter**. Dates are absolute; a register prints dates, not distances. Phone: stacked rows, plus a full-screen **Filters sheet that batches behind Apply**, badge counting *dimensions* touched. |
| `?variant=B` | **Console.** Filtering is the primary act, so nothing is hidden: a permanent 190px **facet rail** down the left of the search pane with every dimension visible at once and **live counts** that ignore their own dimension. Applies **live**, no Apply button, no chips on desktop — a checked box in a visible rail already says what is on. Stays *inside* the split, so results keep the detail pane beside them, and the rail and the list share one column. Sort is a `<select>` above the list; there are no headers to click. Phone: the same rail becomes a sheet with *Show N results*, and active values become removable chips above the list. |
| `?variant=C` | **Query bar.** The corpus is the default and most searches are one dimension deep, so **no filter control is shown until you ask for one**: a keyword box that searches as you type, a single `+ Filter` button, and one chip per added filter that reopens or drops it. The chip row is the whole query state. **Rows are identical at every width** — no table, no sheet, no second layout — and sort is a sentence (*Oldest first*, *Due soonest*, *Recently updated*), because a phone has no column headers anyway. |

Every variant is URL-backed: `?q=`, `?type=`, `?status=`, `?who=`, `?parent=`, `?due=`,
`?from=`, `?to=`, `?labels=`, `?sort=`, `?dir=`. Reload-stable and shareable, and every
change is a real navigation.

Worth trying in each: `Parent: House` + `Type: Subtask` (permanently empty by design —
parent means *one rung*), `Due: Between`, `Due: No due date` (v1's only route to the
backlog), a keyword with no hits, and the `empty` corpus.

## What is real

- The query runs for real in [`src/search.ts`](src/search.ts): values OR within a
  dimension and dimensions AND, keyword ANDing its words over **Summary + Description
  only** (ADR-0013 — never comments), `Overdue` meaning *unfinished and past*, undated
  rows sorting **last in both directions** and never hidden.
- The corpus is 120 work items with real descriptions, so the flat list is genuinely
  unbounded and keyword has something to bite on.
- Labels are a **filter dimension but never a column or a row field** — ADR-0018 put them
  on the detail view only.
- Nothing on the tab mutates (ADR-0012).

## What it never did

`updated` is faked from the id, since the seed carries no `updatedAt`; there is no FTS5,
no snippets, no server, no persistence, and no typing debounce anywhere.
