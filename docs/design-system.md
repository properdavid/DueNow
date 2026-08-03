# The DueNow design system

integral-grc's design system, declared in Tailwind v4 using Supportive's
`@theme inline` architecture (ADR-0014). The token values live in
[`app/app.css`](../app/app.css) and nowhere else; there is no `tailwind.config.*`.

## Typography roles

A role is a **class-string recipe**, not a component and not an `@utility` alias.
The recipe is what you type. There is no `<Heading>`, and a role never grows a
variant — enforcement comes from closing the scale, not from naming the rungs.

| Role | Recipe | Use |
| --- | --- | --- |
| `heading-page` | `text-xl font-semibold` | Page title — one per page |
| `heading-section` | `text-lg font-semibold` | Major section |
| `heading-sub` | `text-base font-medium` | Sub-section, card title |
| `body` | `text-base` | Default body and list text (16px — ADR-0017's amendment) |
| `body-strong` | `text-base font-medium` | Emphasised body |
| `caption` | `text-sm` | Helper text and metadata — **the floor for ordinary text** |
| `micro` | `text-[11px]` | Dense tables — **restricted** |
| `micro-label` | `text-[10px] font-bold uppercase tracking-wide` | Avatar initials, status badges, eyebrow labels — **restricted** |

`text-[11px]` and `text-[10px]` are the only arbitrary sizes `design-lint`
allows. There is no `mono` role: DueNow displays no code, hashes or identifiers,
so the monospace family is not in the token set.

## Density

Spacing is the native Tailwind 4px scale with no semantic aliases.

| Context | Value |
| --- | --- |
| Related controls in a row | `gap-2` |
| Distinct control groups | `gap-4` |
| Stacked page sections | `space-y-6` |
| Card padding, page content | `p-6` |
| Page header region | `p-4` + `border-b` |

**Density and touch comfort are different axes.** Type and spacing hold at every
size; the interactive minimum rises to 44px under `@media (any-pointer: coarse)`.
That rule is expressed **inside the primitives only** — never at a call site.

## Colour

Every colour comes from a semantic token. The families are:

- **surface and brand** — `background`, `foreground`, `card`, `popover`,
  `sidebar`, `primary` (+ `-foreground`, `-soft`), `secondary`, `muted`,
  `accent`, `destructive` (+ `-foreground`, `-subtle`), `border`, `input`, `ring`
- **type colours** — `type-topic` (amber), `type-project` (violet),
  `type-task` (green), `type-subtask` (teal). Type owns shape and hue, and is
  never blue and never a circle.
- **status colours** — `status-open`, `status-in-progress`, `status-completed`,
  `status-closed`, each with `-foreground` and `-subtle`: two greys and one blue,
  the blue shared by In Progress and Completed. Status owns the circle and the blue.
- **radius** — `--radius-sm/md/lg/xl`
- **elevation** — `--elevate-1` / `--elevate-2` behind the `hover-elevate` and
  `active-elevate-2` utilities
- **shadow** — `sm`/`md`/`lg` only

Deliberately absent: the chart ramp, the computed-border indirection, the serif,
signature and monospace families, and `--label-1..8` — a Label carries no colour
(ADR-0018).

`-subtle` **inverts** across modes rather than dimming: about 94% lightness in
light, a low-lightness tint of the same hue in dark.

## Elevation

Hierarchy is tone and hairline borders, never shadow: `background` →
`card`/`popover` plus a border, with `muted`/`accent` as intermediate steps.
**Shadows are reserved exclusively for floating, temporary UI** — dropdown,
dialog, popover, toast, sheet. Nothing in normal flow casts one.

## Dark mode

Theme resolves entirely in CSS (ADR-0015). An explicit choice is a `light` or
`dark` class on the document element; System is no class at all plus
`prefers-color-scheme`. The dark values are written once inside `@variant dark`
and expanded to both selectors by the matching `@custom-variant dark`.

**`dark:` utilities are banned and theme is unreadable from JavaScript.**
Anything that would need to branch on theme gets tokens instead.

## Primitives

shadcn-style CVA + `cn` over Radix, with `lucide-react` icons, in
`app/components/ui/`. Conventions carried verbatim:

- focus is `focus-visible:ring-1 focus-visible:ring-ring` — thin, token-coloured,
  keyboard-only, with `ring-inset` on tabs to avoid overflow clipping
- disabled is `disabled:pointer-events-none disabled:opacity-50`
- a ghost button carries `border border-transparent` so it does not jump on hover
- alerts are a `-subtle` fill with a `/40` border and a tinted icon

## design-lint

`npm run design-lint` is a hard gate with no ratchet baseline. Five rules:

1. no raw Tailwind palette utilities (`bg-slate-50`)
2. no raw hex
3. no `dark:` utilities
4. no arbitrary colour values (`bg-[#ff0000]`, `text-[rgb(…)]`, `bg-[var(--x)]`)
5. no arbitrary font sizes, with `text-[11px]` and `text-[10px]` allowlisted

`prototypes/` sits outside the source root — prototypes exist to break these
rules — as does `public/offline.html` (ADR-0029).
