# Due tab prototype — THROWAWAY

Primary source for [#17](https://github.com/properdavid/DueNow/issues/17): what the Due
tab actually looks like. **Do not merge into `main`, and do not lift this code into the
app** — prototype rules: no tests, no error handling, no abstractions, tokens eyeballed.

```
npm install
npm run dev     # http://localhost:5180
```

## Reading it

The black strip switches variants (arrow keys work), reports **compact** or **split**
([ADR-0017](../../docs/adr/0017-the-navigation-shell-is-two-layouts-and-one-breakpoint.md)'s
one breakpoint at 1024px), and carries a **full / sparse / empty** data control so the
empty-group and empty-tab cases can be seen without editing seed data.

The shell, the Work Items tree ([ADR-0018](../../docs/adr/0018-the-work-items-tree-is-a-full-outline.md))
and the detail view ([ADR-0019](../../docs/adr/0019-the-work-item-detail-view-is-one-editable-document.md))
are held **fixed** across all three; only the Due tab swaps, and it owns its whole pane —
header and filter control included, because where the mine+unassigned toggle lives is part
of the question.

| | |
| --- | --- |
| `?variant=A` | **Ledger.** A dense register. Breadcrumb runs *inline before* the summary, dates are **absolute** in one right-aligned tabular column with a red lateness line under overdue ones, groups are sticky bars with counts, and **no status mark at all**. The toggle is a segmented Mine / Everyone control in the header. Compact keeps the nearest ancestor only. |
| `?variant=B` | **Agenda.** One chronological rail: **dates leave the rows and become day headings** (Today / Tomorrow / Saturday, Aug 8), so nothing prints its own date. Overdue collapses into a red **Late** stretch at the top of Due Now, sorted oldest first, each row saying how late. Type mark leads the row, breadcrumb sits under the summary. The toggle is an avatar pill. |
| `?variant=C` | **Radar.** Cards with a coloured urgency edge, breadcrumb on top, **relative dates first** ("in 3 days", "7 weeks late") with the absolute date beside it, and the one variant that **prints a status mark** — Open vs In Progress being the only thing separating two otherwise identical cards. The toggle is a full-width "Showing … / Show everyone" bar. Empty groups are dashed placeholders. |

`?tab=items` and `?item=<id>` still work — worth opening a Due row to check the hand-off
into the detail view reads the same in all three.

## What is real

- [ADR-0009](../../docs/adr/0009-the-due-tab-shows-the-deepest-item-carrying-each-deadline.md)'s
  selection rule is computed for real in [`src/due.ts`](src/due.ts) — unfinished, dated,
  inside the horizon, and **not covered** by an unfinished descendant due on or before its
  own date, with covering judged over the **visible** set. Flipping the toggle genuinely
  swaps a covered ancestor for a deeper row.
- The seed carries a spread of lateness (2 days, 9 days, 7 weeks), a dated **Topic** (the
  one row with no breadcrumb at all), three-deep lineage, unassigned rows, and a Project
  beyond the 30-day horizon.

## Open questions the prototype exposes

- **The horizon is forward-only here.** A row 47 days late still shows. Reading "within
  thirty days" symmetrically would drop it — #7 did not say, and it only bites on work
  that has been late for over a month.
- **`sparse` / `empty` are a switch, not a state** — the app has no such control.

## What it never did

No persistence, no server, no mutation from the Due tab (settling stays a detail-view act,
per ADR-0019), no Search filter bar, no Settings.
