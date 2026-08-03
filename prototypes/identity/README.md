# Wordmark, app icon and empty-card mark prototype — THROWAWAY

Primary source for [#29](https://github.com/properdavid/DueNow/issues/29): what DueNow
*looks like* — the name set as type, the square that goes on a home screen, and the mark
[ADR-0028](../../docs/adr/0028-an-empty-screen-is-a-card-that-never-offers-to-create.md)
put at the top of five empty cards. **Do not merge into `main`, and do not lift this code
into the app** — prototype rules: no tests, no error handling, no abstractions, tokens
eyeballed, letterforms live system type rather than outlines.

```
npm install
npm run dev     # http://localhost:5183
```

## The seed

The direction came from the household, not from the variants: a **simple checklist icon,
white on the primary indigo, with the two horizontal rules to the right of the ticks
replaced by the letters D and N stacked vertically**. All three variants are built inside
that idea; what they disagree about is how far it travels.

## Reading it

The black strip switches variants (arrow keys work), reports **compact** or **split**
([ADR-0017](../../docs/adr/0017-the-navigation-shell-is-two-layouts-and-one-breakpoint.md)'s
breakpoint at 1024px), and carries [#24](https://github.com/properdavid/DueNow/issues/24)'s
app-state control — every state is a place a mark shows up — plus one state that is not a
screen of the app at all:

| state | what it is |
| --- | --- |
| `icon sheet` | **the default.** Every size [ADR-0029](../../docs/adr/0029-duenow-installs-but-does-not-work-offline.md)'s worker precaches, for all three variants at once |
| `signed out` / `rejected` | the wordmark over ADR-0028's card, and the rejection |
| `first run` / `all settled` | the tree's two empty states, which mean opposite things |
| `radar clear` | the Due tab empty — the screen this household sees most |
| `populated` | the control: nothing empty, so the identity is only the sidebar |

Everything decided already is **fixed**: the shell, the tree
([ADR-0018](../../docs/adr/0018-the-work-items-tree-is-a-full-outline.md)), the detail view
([ADR-0019](../../docs/adr/0019-the-work-item-detail-view-is-one-editable-document.md)),
the Due tab ([ADR-0020](../../docs/adr/0020-the-due-tab-is-a-card-list-read-at-a-glance.md)),
Search ([ADR-0021](../../docs/adr/0021-the-search-tab-is-a-full-window-table.md)), and
ADR-0028's card itself — mark, headline, one line, no create button. **Three things swap
and only three**: the wordmark, the app icon, and the card mark.

| | |
| --- | --- |
| `?variant=A` | **Tile.** The source SVG's outer rounded square *is* the app tile, so nothing is drawn twice — two ticks left, D over N right, edge to edge. The icon and the wordmark are separate objects that never appear together: the wordmark is set type alone, in the sidebar and over the sign-in card. The empty cards have nothing to do with the brand — each is headed by a picture of **the surface**, so the tree card, the Due card and the unselected column all differ. |
| `?variant=B` | **Badge.** The rounded square is *drawn*, in white, inside the indigo tile — the source SVG kept whole. That gives the mark its own edge, so it can leave the tile: it locks up beside the wordmark on sign-in **and** in the sidebar, and the same shape heads all five empty cards in flat grey. One shape to learn; the headline says which screen. |
| `?variant=C` | **Monogram.** No ticks at all — D over N and nothing else, which is the ticket's own guess. It exists to ask the one question A and B cannot ask of themselves: **do the ticks survive 16px, or are they texture?** The wordmark joins by weight rather than a capital — *due**Now*** — and nothing travels beside it. The empty cards borrow marks the app already owns: the amber Topic star, the Completed check, ADR-0020's urgency edge with nothing to colour it. |

## Where to look

- **`icon sheet`, the 64 / 32 / 16 row.** True pixel sizes, all three side by side. This
  is the row the icon is actually decided on; everything looks fine at 512.
- **`icon sheet`, the maskable row.** Android crops to the dashed circle — B's drawn frame
  is the one with something near the edge to lose.
- **`first run` at desktop width, variant B.** The mark prints **three times on one
  screen** — sidebar, tree card, unselected column. That is the cost of a mark that
  travels, and it is most visible on the very first screen a household ever sees.
- **`radar clear` on all three.** The healthiest screen in the app, and the one whose card
  is seen most often. A gives it a clock, B gives it the brand, C gives it a grey edge.
- **Compact (narrow the window under 1024).** The sidebar lockup disappears entirely —
  there is no title bar (ADR-0017) — so in compact the wordmark only ever appears on the
  sign-in screen. Whether the mark travels is therefore a **desktop-only** question.

## What it never did

No exported artwork: the icons are SVG drawn in React and the letters are live system
type. A real icon set outlines the letters and ships PNGs at 192 and 512 plus a maskable
variant and an `.ico`. No manifest, no service worker, no favicon actually installed.

## The verdict

_To be filled in when the variant is picked — and the interesting answer is likely to be
a mix: one variant's icon with another's card marks._
