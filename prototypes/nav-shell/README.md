# Nav shell prototype — THROWAWAY

Primary source for [#10](https://github.com/properdavid/DueNow/issues/10) and
[ADR-0017](../../docs/adr/0017-the-navigation-shell-is-two-layouts-and-one-breakpoint.md).
This branch exists so the discarded variants survive. **Do not merge it into `main`, and
do not lift this code into the app** — it was written under prototype rules: no tests, no
error handling, no abstractions, tokens eyeballed rather than ported.

```
npm install
npm run dev     # http://localhost:5177
```

## Reading it

The black strip at the top switches variants and reports the **effective** viewport width
— the type scale zooms the frame, so the number the layout actually sees is not
`window.innerWidth`. Arrow keys work too.

| | |
| --- | --- |
| `?variant=A` | **One responsive shell.** integral-grc ported straight — one collapsible sidebar at every width, a Sheet below 768, single pane throughout, opening an item navigates. |
| `?variant=B` | **Device-shaped.** Three layouts: bottom tab bar on phone, icon rail on tablet, sidebar plus resizable split on desktop. |
| `?variant=C` | **Chromeless / command-first.** One thin top bar, a segmented control for two surfaces, Search as a ⌘K palette, detail as an overlay drawer. |
| `?variant=D` | **The winner.** B revised across three rounds: floating capsule, one universal FAB, no title bar, two layouts and one breakpoint at 1024. |

`?scale=0..3` sets the base type size (14 / 15 / 16 / 17px). 16 is the default and the
decision; the control is left in because it is what settled it, and because it shows the
breakpoint moving as type grows — at 17px an iPad in landscape falls back to compact.

`?tab=due|items|search|settings` and `?item=<id>` address a surface directly.

## What is where

- `src/data.ts` — a household's worth of stub work items, four rungs deep, plus the Due
  radar's covering rule from ADR-0009, so the Due tab shows what it will really show.
- `src/screens.tsx` — the content components, shared across variants deliberately; the
  **layout** is what the variants disagree about.
- `src/variants/*.tsx` — one shell each, sharing no layout on purpose.
- `src/proto.tsx` — variant switcher, nav state in the URL, the scale control.

## What it never did

No persistence, no mutations, no auth, no routing beyond search params. Every button that
would write is a stub. The question was what the shell should be, not whether the app
works.
