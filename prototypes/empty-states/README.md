# Sign-in and empty states prototype — THROWAWAY

Primary source for [#24](https://github.com/properdavid/DueNow/issues/24): what an
unauthenticated visitor sees, and what each surface shows before there is anything in
it. **Do not merge into `main`, and do not lift this code into the app** — prototype
rules: no tests, no error handling, no abstractions, tokens eyeballed.

```
npm install
npm run dev     # http://localhost:5182
```

## Reading it

The black strip switches variants (arrow keys work), reports **compact** or **split**
([ADR-0017](../../docs/adr/0017-the-navigation-shell-is-two-layouts-and-one-breakpoint.md)'s
one breakpoint at 1024px), and carries the **app state** control — which is the whole
question, because [ADR-0024](../../docs/adr/0024-a-fresh-deployment-starts-empty.md) says
*empty is two states, not one*:

| state | what it is |
| --- | --- |
| `signed out` | the sign-in screen |
| `rejected` | signed in to Google, not on the allowlist ([ADR-0004](../../docs/adr/0004-google-oauth-with-email-allowlist.md)) |
| `first run` | a fresh deployment — **zero work items, ever** |
| `all settled` | a populated tree where every Topic is terminal — zero *visible* rows, opposite meaning |
| `radar clear` | a healthy populated household with nothing dated inside the 30-day Horizon |
| `populated` | the control — normal app, nothing empty |

The shell, the tree ([ADR-0018](../../docs/adr/0018-the-work-items-tree-is-a-full-outline.md)),
the detail view ([ADR-0019](../../docs/adr/0019-the-work-item-detail-view-is-one-editable-document.md)),
the Due tab ([ADR-0020](../../docs/adr/0020-the-due-tab-is-a-card-list-read-at-a-glance.md))
and Search ([ADR-0021](../../docs/adr/0021-the-search-tab-is-a-full-window-table.md)) are
held **fixed**. Only four things swap: the **sign-in screen**, the **empty tree**, the
**empty Due tab**, and the **Split Layout's unselected right column**.

| | |
| --- | --- |
| `?variant=A` | **Signpost.** Every empty screen is a centred card — mark, headline, one line of explanation, primary action. The stance: an empty screen is a moment of doubt (*is it broken, or is there genuinely nothing?*) and the card answers it loudly. Sign-in is a card; the rejection is the same card with a different message. Watch what happens in split, where the empty list column and the unselected detail column each print a card. |
| `?variant=B` | **Bare.** One dim sentence exactly where the first row would have been, in the same type as the rows it stands in for. No card, no mark, no button that repeats a control already on screen (the FAB and the sidebar button are both right there). The unselected column is genuinely blank. The stance: ADR-0014's register is a dense professional one, the household sees these screens for years, and a full-page card is a beginner's screen shown to experts. |
| `?variant=C` | **Working.** The space gets a job. First Run puts a **live composer** where the first row would be, so the first Topic is typed into the tree; a clear radar reports the **next dated work past the Horizon** instead of announcing its own emptiness; the unselected column runs a standing **Next up** list. |

## What is real

- The corpus really is empty in `first run` — every empty state tests `t.items.length === 0`,
  never "is a row visible", which is ADR-0024's rule.
- `all settled` puts every Topic behind the tree's own per-parent reveal, so the state is
  genuinely *zero rows plus a reveal* — and the reveal works.
- `radar clear` pushes every due date past 30 days, so ADR-0009's rule empties the Due tab
  honestly and variant C has a real "next" to name.
- Variant C's composer creates a real Topic in the in-memory store. Its suggestion chips
  **type into the box** and insert nothing — ADR-0024 forbids seeded content, and there is
  no delete in v1.

## Known tensions, deliberately built in

- Variant C's composer is a **second creation entry point**, which ADR-0017 and ADR-0018
  spent effort reducing to one. It is reachable exactly once in a deployment's lifetime,
  and it vanishes the moment the first Topic exists — flip to `first run` and type to see
  how that lands.
- Variant C's **Next up** column and the Due tab can print the same sentence twice on one
  screen. Open `?variant=C&state=clear&tab=due` at desktop width.
- Variant A prints **two cards on one screen** in split at first run.

## What it never did

No server, no OAuth, no persistence, no allowlist — `rejected` is a URL state, not a
round trip. The rejected address is a literal in `src/empty.ts`.

## The verdict

**A — Signpost won**, on every one of the four surfaces, and it was amended twice while
being judged:

1. **No empty-state card carries a create button.** The FAB (compact) and the sidebar
   button (split) are already on screen, and the empty state is the moment to teach where
   creation lives rather than to offer a second door to it. This dropped the button from
   the tree's *all settled* card too, so the rule is uniform rather than per-surface, and
   the copy names the verb without naming a location — the control sits in a corner on a
   phone and at the top of the sidebar on a desktop.
2. **The rejection reads for a non-technical visitor** — no "list", no "instance", no
   "configuration".

Two cards on one screen at first run in split was looked at and kept: the right column's
card signposts what will go there once something is selected.

B and C lost. B is calmer but never distinguishes a healthy screen from a broken one; C's
composer buys one keystroke-saving moment at the cost of a second creation entry point,
and its *Next up* column prints the Due tab's own sentence twice on one screen.
