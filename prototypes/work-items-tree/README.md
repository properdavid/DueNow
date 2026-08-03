# Work Items tree prototype — THROWAWAY

Primary source for [#11](https://github.com/properdavid/DueNow/issues/11): how the Work
Items tree looks and behaves, and how you create things in a strict type ladder.
**Do not merge into `main`, and do not lift this code into the app** — prototype rules:
no tests, no error handling, no abstractions, tokens eyeballed.

```
npm install
npm run dev     # http://localhost:5178
```

## Reading it

The black strip switches variants (arrow keys work) and reports whether the shell is in
**compact** or **split** — [ADR-0017](../../docs/adr/0017-the-navigation-shell-is-two-layouts-and-one-breakpoint.md)'s
one breakpoint at 1024px. The shell is held **fixed** across all three variants; only
the Work Items tab swaps, so the comparison is about the tree, not the frame.

| | |
| --- | --- |
| `?variant=A` | **Full outline.** All four rungs in one indented scroll. Creation is global only (FAB / sidebar button); a row's ⋯ can pre-fill the parent. Terminal items hide behind a per-parent "n settled — show". |
| `?variant=B` | **Drill-down.** The tree is never drawn whole and nothing is indented — you stand *inside* one work item and see a flat, full-width list of its children. Creation needs no picker: the parent is the screen. Split shows the last two levels as Miller columns. |
| `?variant=C` | **Sectioned checklist.** Topics become sticky sections and Projects become group headers, so only Tasks and Subtasks are rows. Every list ends in a live capture field. Terminal items dim and sink rather than hide; the checkbox runs the settle cascade. |

`?tab=due|items|search|settings` and `?item=<id>` address a surface directly.

## What is real

- **Creation, reparenting and both cascades mutate in memory** ([`src/store.tsx`](src/store.tsx)) —
  the settle and start cascades from [ADR-0003](../../docs/adr/0003-status-is-stored-and-propagation-is-one-way.md),
  and the parent picker from [ADR-0016](../../docs/adr/0016-reparenting-moves-a-subtree-within-its-rung.md),
  which lists only valid parents and refuses the moving item's own subtree.
- The seed is a household's worth of work items, four rungs deep, including deliberately
  long summaries to stress the compact row.

## What it never did

No persistence, no server, no auth, no field editing, no Search filter bar. The Due and
Search tabs are thin stand-ins so the tree has neighbours; the detail view is
[#12](https://github.com/properdavid/DueNow/issues/12)'s question and is stubbed.
