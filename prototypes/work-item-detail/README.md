# Work item detail prototype — THROWAWAY

Primary source for [#12](https://github.com/properdavid/DueNow/issues/12): what a work
item detail view looks like, on a phone and on a desktop, for all four rungs.
**Do not merge into `main`, and do not lift this code into the app** — prototype rules:
no tests, no error handling, no abstractions, tokens eyeballed.

```
npm install
npm run dev     # http://localhost:5179
```

## Reading it

The black strip switches variants (arrow keys work) and reports whether the shell is in
**compact** or **split** — [ADR-0017](../../docs/adr/0017-the-navigation-shell-is-two-layouts-and-one-breakpoint.md)'s
one breakpoint at 1024px. The shell and the Work Items tree are held **fixed** across all
three ([ADR-0018](../../docs/adr/0018-the-work-items-tree-is-a-full-outline.md)); only the
detail view swaps, and it owns its whole pane — header, breadcrumb and back/close
included, because how a detail view says where you are is part of the question.

| | |
| --- | --- |
| `?variant=A` | **Document.** One scroll: breadcrumb, big summary, a wrapping strip of property *chips*, description as prose, children, comments last. No edit mode — every value is its own control, popover-edited, committed on the spot. A cascade is a popover under the chip you already touched, listing what it will sweep. |
| `?variant=B` | **Record.** A form over a record. Fields live in a labelled rail — right column when split, a one-line summary bar opening a sheet when compact — and **nothing commits until Save**. The body is tabbed (Description / children / Comments) so the phone never scrolls past three surfaces. A cascade is a modal listing every affected item. |
| `?variant=C` | **Workbench.** Action-first: a full-width Start/Complete bar under the summary, children as the body with progress, description demoted to a line, fields collapsed into a `details` disclosure, and comments as a chat thread with a composer pinned above the tab capsule. Cascades **do not confirm** — they happen, and a toast says what moved, with Undo. |

`?item=<id>` opens a work item directly. Worth opening one of each rung — `item=1` (Topic),
`item=2` (Project), `item=3` (Task, four comments), `item=5` (Subtask) — to see whether one
view really does parameterise over all four.

## What is real

- Field edits, comments, and both cascades from
  [ADR-0003](../../docs/adr/0003-status-is-stored-and-propagation-is-one-way.md) mutate in
  memory ([`src/store.tsx`](src/store.tsx)), so the settle sweep and the start walk-up are
  genuinely computed — `settlePreview` and `startPreview` are what each variant announces.
- Reparenting reuses the picker from
  [ADR-0016](../../docs/adr/0016-reparenting-moves-a-subtree-within-its-rung.md).
- Variant C's Undo restores the whole pre-cascade snapshot.

## What it never did

No persistence, no server, no Markdown rendering (the description is a plain textarea, per
#5), no comment edit or delete, no label creation, no auth. The Due and Search tabs are the
thin stand-ins inherited from the tree prototype.
