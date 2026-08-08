---
version: alpha
name: DueNow
description: >-
  Design system for DueNow, a self-hosted household work tracker. Dense,
  professional and calm — JIRA's shape at a household's scale. This file is
  canonical for design DECISIONS, token NAMING, and rationale; app/app.css is
  canonical for the literal token VALUES. Where a value here disagrees with
  app.css, app.css wins and this file must be updated to match. Colours are
  expressed in the same HSL form app.css uses so the two can be diffed directly.
  The system is integral-grc's, ported onto Tailwind v4's CSS-first architecture
  (ADR-0014); dark mode resolves entirely in CSS (ADR-0015).
colors:
  # --- Brand / surfaces (mirror app/app.css :root; dark values live in the same file) ---
  primary: "hsl(245 55% 52%)"
  primary-foreground: "hsl(0 0% 100%)"
  primary-soft: "hsl(245 60% 96%)" # the disc behind a Surface Mark (ADR-0030)
  background: "hsl(240 6% 98%)"
  foreground: "hsl(240 10% 12%)"
  card: "hsl(0 0% 100%)"
  card-foreground: "hsl(240 10% 12%)"
  popover: "hsl(0 0% 100%)"
  popover-foreground: "hsl(240 10% 12%)"
  sidebar: "hsl(240 5% 96%)"
  sidebar-foreground: "hsl(240 10% 12%)"
  sidebar-border: "hsl(240 6% 88%)"
  secondary: "hsl(240 5% 95%)"
  secondary-foreground: "hsl(240 10% 20%)"
  muted: "hsl(240 5% 95%)"
  muted-foreground: "hsl(240 5% 45%)"
  accent: "hsl(245 30% 95%)"
  accent-foreground: "hsl(245 45% 40%)"
  border: "hsl(240 6% 88%)"
  input: "hsl(240 6% 82%)"
  ring: "hsl(245 55% 52%)"
  destructive: "hsl(0 72% 52%)"
  destructive-foreground: "hsl(0 0% 100%)"
  destructive-subtle: "hsl(0 72% 95%)"
  # --- Due tab urgency edge colours: semantic to the radar, not status/type ---
  urgency-overdue: "hsl(0 72% 52%)"
  urgency-today: "hsl(38 85% 46%)"
  urgency-soon: "hsl(245 60% 86%)"
  urgency-later: "hsl(240 6% 82%)"
  # --- Type colours: one per rung of the Type Ladder, never blue, never a circle ---
  type-topic: "hsl(38 85% 46%)" # amber
  type-project: "hsl(265 50% 55%)" # violet
  type-task: "hsl(140 45% 34%)" # green
  type-subtask: "hsl(178 55% 30%)" # teal
  # --- Status colours: two greys and one blue, shared by In Progress and Completed ---
  status-open: "hsl(240 4% 55%)"
  status-open-foreground: "hsl(0 0% 100%)"
  status-open-subtle: "hsl(240 5% 94%)"
  status-in-progress: "hsl(215 75% 48%)"
  status-in-progress-foreground: "hsl(0 0% 100%)"
  status-in-progress-subtle: "hsl(215 70% 94%)"
  status-completed: "hsl(215 75% 48%)"
  status-completed-foreground: "hsl(0 0% 100%)"
  status-completed-subtle: "hsl(215 70% 94%)"
  status-closed: "hsl(240 4% 40%)"
  status-closed-foreground: "hsl(0 0% 100%)"
  status-closed-subtle: "hsl(240 5% 92%)"
typography:
  # role : recipe is the exact Tailwind class string engineers type.
  heading-page: # text-xl font-semibold
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
  heading-section: # text-lg font-semibold
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
  heading-sub: # text-base font-medium
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4
  body: # text-sm  (default body — 14px, ADR-0032 restores integral-grc's rung)
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-strong: # text-sm font-medium
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.5
  caption: # text-xs  (THE FLOOR for ordinary text)
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  micro-label: # text-[10px] font-bold uppercase tracking-wide (SANCTIONED, restricted use)
    fontFamily: Inter
    fontSize: 10px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.04em
rounded:
  sm: 6px
  DEFAULT: 8px # rounded-md -- buttons, inputs, badges, menu items
  lg: 10px # cards, dialogs, popovers
  xl: 14px
  full: 9999px # Avatars, the tab capsule, Label chips
spacing:
  # Native Tailwind 4px scale is blessed as-is. No semantic spacing tokens.
  # Density conventions live in the Layout prose. base is informational only.
  base: 4px
touch:
  # Density and touch comfort are different axes (ADR-0014).
  coarse-pointer-minimum: 44px # @media (any-pointer: coarse), inside the primitives only
components:
  button-write: # commits to stored data
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.DEFAULT}"
  button-open: # leads toward a write
    backgroundColor: "{colors.card}"
    borderColor: "{colors.primary}"
    textColor: "{colors.primary}"
    rounded: "{rounded.DEFAULT}"
  button-destroy: # deletes stored data
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive-foreground}"
    rounded: "{rounded.DEFAULT}"
  button-discard: # throws away user-produced content or a selection
    backgroundColor: "{colors.card}"
    borderColor: "{colors.destructive}"
    textColor: "{colors.destructive}"
    rounded: "{rounded.DEFAULT}"
  button-neutral: # neither, standalone
    backgroundColor: "{colors.card}"
    borderColor: "{colors.input}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.DEFAULT}"
  button-bare: # neither, inline or icon
    borderColor: transparent
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.DEFAULT}"
  badge-status: # uppercase micro-badge -- statuses are treatment, not only hue
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.micro-label}"
    rounded: "{rounded.DEFAULT}"
  badge-chip: # a Label chip -- neutral, detail view only, carries no colour (ADR-0018)
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
  dialog: # floating, temporary UI -- one of the few things allowed a shadow
    backgroundColor: "{colors.popover}"
    textColor: "{colors.popover-foreground}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
---

# DueNow -- Design System

This is the single design "bible" for DueNow. It codifies the design system the
app expresses in code and is the forward template for all new UI work.

**Source of truth.** This file is canonical for _decisions, token naming, and
rationale_; [app/app.css](app/app.css) is canonical for the literal token
_values_ and wires them into Tailwind utilities through `@theme inline`. The YAML
frontmatter above carries the agreed vocabulary and representative values for
tooling; when a value here disagrees with `app.css`, `app.css` wins and this file
is corrected to match. There is no token codegen pipeline, so never hardcode a
colour: if you need a colour that is not a token, add it to the token system
first, then use it. `design-lint` enforces this.

**Stack.** React 19 + React Router v7 (framework mode, SSR) + Vite, with a local
shadcn-style primitive library under
[app/components/ui](app/components/ui) built on Radix UI + Tailwind v4 +
class-variance-authority, and `lucide-react` icons. There is no
`tailwind.config.*`: the token set is declared in CSS. Theming resolves entirely
in CSS -- `light` / `dark` on `<html>` for an explicit choice, and
`prefers-color-scheme` for System (ADR-0015).

The document `theme-color` meta is the one app-code exception to the "no literal
colour values" rule: browsers do not resolve CSS custom properties there, so the
server-rendered descriptors repeat the primary token values exactly, including
the `prefers-color-scheme` pair for System. Treat them like the manifest
`theme_color` and keep them in lockstep with `app.css`.

## Overview

DueNow is a work tracker for one two-person household -- a four-rung tree, four
statuses, a filter bar. The product should feel **dense, professional, calm and
precise**, closer to a serious work tool than a consumer to-do app. A rounded,
airy, Reminders-style skin would fight the model it wraps.

The register is set by three decisions: `body` is 14px (integral-grc's ladder,
restored by ADR-0032), spacing stays on the native 4px scale with no semantic
aliases, and hierarchy comes from tone and hairline borders rather than shadow.
Colour is
restrained -- an indigo primary on near-neutral greys -- because the screens are
dominated by two icon vocabularies (four **Type Marks**, four **Status Marks**)
that tinted chrome would pull off-true.

When no specific token or rule below covers a case, choose the option that is
calmer, denser and more legible.

The **Wordmark** is a named surface rather than a typography role: in the Split
Layout sidebar it renders at 15px, Inter semibold, tightened tracking, in
primary indigo.

## Colors

All app colour flows through semantic CSS variables in
[app/app.css](app/app.css), exposed as Tailwind utilities (`bg-primary`,
`text-muted-foreground`, and so on). Raw Tailwind colour utilities
(`bg-slate-50`, `text-blue-600`), raw hex and arbitrary colour values are **not**
permitted -- they bypass the token system and break theming.

### Brand and surfaces

The palette is a single indigo brand colour on near-neutral greys.

- **Primary -- `hsl(245 55% 52%)` light, `hsl(245 60% 68%)` dark.** In the
  serious-tool family without being the default corporate blue, and clear of the
  215 blue the statuses use. It carries the single most important action on a
  screen, the active navigation item, the focus ring and the **Wordmark**.
  Validated against blue 220 and purple 270 in a mock Due tab.
- **Background / Foreground.** Page background is a near-white neutral
  (`hsl(240 6% 98%)`) in light and `hsl(240 8% 9%)` in dark; text inverts.
- **Card / Popover.** White (light) / `hsl(240 8% 12%)` (dark) surfaces sitting
  _above_ the page background -- the primary depth mechanism (see Elevation).
- **Secondary / Muted / Accent.** Low-emphasis fills for secondary buttons, muted
  metadata (`muted-foreground`), and the tinted accent behind an active sidebar
  item or a hover.
- **Border / Input / Ring.** Hairline separators, input outlines and the focus
  ring, which tracks `primary`.
- **Destructive.** Delete, and the red an **Overdue** date is carried in.
- **Urgency.** The Due tab's **Urgency Edge** uses dedicated semantic tokens:
  `urgency-overdue`, `urgency-today`, `urgency-soon`, and `urgency-later`.
  They intentionally share families with destructive red, amber, faint indigo,
  and neutral grey without making raw colour utilities valid at call sites.

**Greys are near-neutral, at or below 8% saturation, and are not tinted toward
the brand hue.** The chrome carries two icon axes; tinted chrome pulls both off
true and eats the contrast that makes them scannable.

### Type colours

Four, one per rung of the **Type Ladder**. **Type owns shape and hue.** No Type
Mark is ever a circle and none is ever blue, so type and status can never be
confused, and both pair shape with hue so neither depends on colour alone.

| Token          | Rung    | Mark    | Light value        |
| -------------- | ------- | ------- | ------------------ |
| `type-topic`   | Topic   | star    | `hsl(38 85% 46%)`  |
| `type-project` | Project | diamond | `hsl(265 50% 55%)` |
| `type-task`    | Task    | square  | `hsl(140 45% 34%)` |
| `type-subtask` | Subtask | triangle| `hsl(178 55% 30%)` |

### Status colours

Exactly **four** status roles exist, drawn from **two greys and one blue**.
**Status owns the circle and the blue.** In Progress and Completed share the blue
because both mean the work is live or landed; they are told apart by fill.

| Token                | Meaning                     | Mark             | Light value        |
| -------------------- | --------------------------- | ---------------- | ------------------ |
| `status-open`        | Not started                 | empty grey ring  | `hsl(240 4% 55%)`  |
| `status-in-progress` | Underway                    | half-filled blue | `hsl(215 75% 48%)` |
| `status-completed`   | Terminal and achieved       | blue check       | `hsl(215 75% 48%)` |
| `status-closed`      | Terminal and not achieved   | filled grey      | `hsl(240 4% 40%)`  |

Each role has three parts: the **solid** colour (marks and icons), a
**`-foreground`** (text that sits on the solid fill), and a **`-subtle`** tint
(badge and callout backgrounds).

**Don't:** raw `bg-green-600`, `text-amber-500` or `bg-blue-600` for status. Use
the four roles.

### Dark mode

Theme is stored per user as System, Light or Dark and **resolves entirely in
CSS** (ADR-0015). An explicit choice renders as a `light` or `dark` class on the
document element; System renders no class and is resolved by
`prefers-color-scheme`. The dark values are written **once**, inside
`@variant dark`, and expanded to both selectors by the matching
`@custom-variant dark`, so the two can never drift apart.

The `-subtle` tints **invert** rather than dim: the ~94%-lightness light-mode
tints become low-lightness tints of the same hue, so a badge reads as a dark
tinted pill and not a glaring light block.

**`dark:` utilities are banned and theme is unreadable from JavaScript.** Every
colour comes from a semantic token and the token block redefines itself per mode,
so no component needs to know what mode it is in. Anything that would need to
branch on theme -- a canvas, an embed, an image swap -- gets tokens of its own.

### Families deliberately absent

Four families from integral-grc are **not** ported, and reaching for them is a
design change, not a styling choice:

- **The chart ramp** (`chart-1..N`) -- v1 draws no charts.
- **The computed-border indirection** (`--primary-border` and friends, derived
  through `hsl(from …)`) -- borders come from `border` and `input`.
- **The serif, signature and monospace families.** Inter is the only family, and
  it is self-hosted. Dropping mono drops the `mono` typography role with it:
  DueNow displays no code, hashes or identifiers.
- **`--label-1..8`.** A **Label** carries no colour (ADR-0018). Labels turned out
  to be filter vocabulary rather than identity, so they render only on the Detail
  View, as neutral chips.

## Typography

One family for the product UI: **Inter** (`--font-sans`), self-hosted, with no
remote font fetch. There is no second family.

Each role below is a **semantic name** bound to an **exact Tailwind recipe**. Use
the recipe verbatim; the name is the shared vocabulary. **A role is not a
component and not an `@utility` alias** -- each recipe is two utilities long, so a
name buys no compression, and a named role invites the variant that erodes the
scale from inside (`heading-section-sm`). Enforcement comes from closing the
scale, not from naming the rungs.

| Role              | Tailwind recipe                                 | Use                                                                          |
| ----------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `heading-page`    | `text-xl font-semibold`                         | Page title (one per page)                                                    |
| `heading-section` | `text-lg font-semibold`                         | Major section heading                                                        |
| `heading-sub`     | `text-base font-medium`                         | Sub-section / card title                                                     |
| `body`            | `text-sm`                                       | Default body, list and row text                                              |
| `body-strong`     | `text-sm font-medium`                           | Emphasised body -- a row's Summary                                           |
| `caption`         | `text-xs`                                       | Helper text, metadata, breadcrumbs -- **the floor for ordinary text**        |
| `micro-label`     | `text-[10px] font-bold uppercase tracking-wide` | **Sanctioned, restricted** -- Avatar initials, status badges, eyebrow labels |

**`body` is 14px.** ADR-0032 reverses ADR-0017's amendment and returns the scale
to integral-grc's ladder unmodified. The app is a dense work tool more often than
it is a page of prose, and the extra rung was paid for on every dense surface --
most visibly the Work Items tree row, where every role competes for one
horizontal budget. The root font size stays 16px: Tailwind's breakpoints and the
4px spacing scale are rem-based, so moving it would move the split breakpoint and
the spacing scale too. Because `body` moved back down, `heading-sub` recovers its
distinction from size rather than weight.

**Form controls are pinned to 16px on coarse pointers**
(`[@media(any-pointer:coarse)]:text-base` on `Input`, `Textarea` and `Select`).
iOS Safari zooms the page when a control under 16px takes focus, and the viewport
meta carries no `maximum-scale` to stop it. Desktop keeps the dense register;
touch stops zooming. A control's text therefore does not match its label's size
on touch -- the correct trade, since the label is not what triggers the zoom.

### The 12px floor and the one sanctioned micro role

`caption` (`text-xs`, 12px) is the **floor for all ordinary text** -- body,
helper, validation and informational messages never go below it.

Below it, only **one** role exists, and it is allowed **only** for a documented
reason:

- **`micro-label` (10px)** -- one of three justified reasons:
  1. **Geometry** -- text must fit a fixed shape (an Avatar's initial in a small
     disc, a badge inside a tree row).
  2. **Typographic tiering** -- an uppercase status micro-badge or eyebrow label
     that must visually recede below the content it annotates.
  3. **Row density** -- compact pills (`py-0`) inside dense tree or table rows
     that must not increase row height.

`micro` (11px) is **retired** (ADR-0032): one pixel below the floor is not a
typographic tier. Its only user, the Search Results Table, converges up to
`caption`.

Any other sub-12px text converges up to `caption`. Arbitrary one-off sizes
(`text-[13px]`, `text-[0.8rem]`) are banned; `text-[10px]` is the only arbitrary
size `design-lint` allows, and only as `micro-label`.

**Headings.** Page titles are `heading-page` (`text-xl font-semibold`) -- not
`font-bold`, not `text-2xl`.

## Layout

The app uses native Tailwind spacing (the 4px scale). **No semantic spacing
tokens are introduced** -- the scale is already consistent and the code speaks
Tailwind directly. Instead, follow density conventions:

| Context                     | Convention                      |
| --------------------------- | ------------------------------- |
| Related controls in a row   | `gap-2`                         |
| Distinct control groups     | `gap-4`                         |
| Stacked page sections       | `space-y-6`                     |
| Card internal padding       | `p-6`                           |
| Page content region padding | `p-6`                           |
| Page header region padding  | `p-4` with a `border-b` divider |
| Dense list row padding      | `py-2`, with the horizontal insets owned by the tree geometry module rather than chosen at the call site |

Arbitrary `gap-[Npx]` / `p-[Npx]` values are banned; use the scale.

### The list column has a width contract

In the split layout the list column is resizable, so its width is an input to the
layout rather than a constant. ADR-0031 makes that safe: the **Work Items tree
row chooses between its one-line and stacked shapes from its own column width**
(a container query), not from the viewport, and the tree guarantees a **pixel
budget for the Summary at the deepest rung at every width the column can take**.

The constants -- indent per rung, the row's fixed chrome, the stack threshold,
the column's floor, default and ceiling -- live in **one geometry module with
unit-tested arithmetic**. Adding an element to a tree row means recomputing them
there; the test asserts the Summary budget survives. The character-to-pixel
figure behind the budget is a recorded measurement, not an assumed constant --
see ADR-0031 for the table and when to re-measure it.

The splitter itself is a **full-height target on the shared border** with a
visible hover state and keyboard support, and its width **persists in a cookie**
shared by `/due`, `/items` and `/search`, so the server renders the correct
geometry on first paint. Native CSS `resize-x` is not used: its grip is invisible
under overlay scrollbars and sits in the window's bottom corner.

### Density and touch comfort are different axes

Type size and spacing are **density**; control height is **touch comfort**. They
move independently. Interactive minimums rise to **44px** under
`@media (any-pointer: coarse)` while type and spacing stay put, so a phone gets
safe targets without the whole interface loosening.

**One exception, and it is not a density decision.** `Input`, `Textarea` and
`Select` raise their *type* to 16px under the same query, because iOS Safari
zooms the viewport when a focused control sits below 16px. That is a platform
behaviour being suppressed, not the interface loosening -- no other role moves,
and the surrounding labels stay at `body`.

`any-pointer` is chosen over `pointer` deliberately: it reports _any_ attached
input rather than the primary one, so a hybrid touchscreen laptop gets the larger
controls permanently. Neither query re-evaluates when a person switches hand to
trackpad, so the choice is which way to be wrong forever -- and a miss-tap on a
real touchscreen costs more than a few pixels of density.

**The rule is expressed only inside the primitives -- roughly six files -- and
never at a call site.** A test fails the build if
`[@media(any-pointer:coarse)]` appears outside `app/components/ui`.

## Elevation & Depth

Hierarchy is conveyed through **tonal layering**, not shadow. The page
`background` is the base layer; `card` and `popover` surfaces sit above it,
reinforced by hairline `border`s, with `muted` / `accent` as further tonal steps.
The `--elevate-1` / `--elevate-2` overlays supply hover and active feedback
through the `hover-elevate` and `active-elevate-2` utilities, which paint over
whatever background the element already has.

**Shadows are reserved exclusively for floating, temporary, dismissible UI** --
dropdown, dialog, popover, toast, sheet. The shadow says "this is ephemeral and
sits above the page". Inline cards, rows and panels use tone and border, never
shadow. The ramp is trimmed to `sm` / `md` / `lg`, because three rungs is all
that transient overlays need.

## Shapes

| Token          | Value  | Use                                                       |
| -------------- | ------ | --------------------------------------------------------- |
| `rounded-md`   | 8px    | Buttons, inputs, badges, menu items -- the default        |
| `rounded-lg`   | 10px   | Cards, dialogs, popovers                                  |
| `rounded-full` | 9999px | Avatars, the tab capsule, Label chips                     |

`rounded-sm` (6px) and `rounded-xl` (14px) exist in the ramp but have no current
call site; reach for one only with a reason. **Do not mix sharp and rounded
corners in the same view.**

## Components

All interactive components come from the local primitive library at
[app/components/ui](app/components/ui): shadcn-style CVA + `cn` over Radix.
Conventions adopted verbatim from integral-grc:

- Focus is `focus-visible:ring-1 focus-visible:ring-ring` -- thin,
  token-coloured and keyboard-only, with `ring-inset` on tabs so the ring is not
  clipped in an overflow-x container.
- Disabled is `disabled:pointer-events-none disabled:opacity-50`.
- Alerts render as a `-subtle` fill with a `/40` border and a tinted icon.
- Icons are `lucide-react`, sized by the primitive
  (`[&_svg]:size-4 [&_svg]:shrink-0`), never by the call site.

### Button

[app/components/ui/button.tsx](app/components/ui/button.tsx).
**A button's colour states its effect on stored data** (ADR-0034). Hue is
valence -- indigo constructive, red destructive, grey neither. Fill versus border
is persistence -- **a fill commits, a border leads toward**. Faking either with a
raw colour utility is banned.

| Variant   | What the click does                                          |
| --------- | ------------------------------------------------------------ |
| `write`   | Posts to a mutation route -- creates or updates stored data   |
| `open`    | Opens a dialog, picker or menu that leads to a write          |
| `destroy` | Deletes stored data                                           |
| `discard` | Throws away user-produced content or an accumulated selection |
| `neutral` | Neither -- standalone (Search, Retry, Collapse all)           |
| `bare`    | Neither -- inline or icon (chevrons, row menus, `show`)       |
| `inline`  | A click target **on content**, which takes no bucket          |

The mechanical test for `write` is ADR-0022's verb-shaped resource routes: a
button either posts to an `api.*` action or it does not. `neutral` is the
default, so an unclassified button never claims to write.

**The two hues are deliberately asymmetric.** You are *led toward* a write --
anything that opens a picker or dialog carries the indigo border -- but *gated
before* a delete: a button that merely opens a delete confirmation is `neutral`,
because the confirmation is the warning and warning twice is noise.

**The scheme colours chrome, not content.** A click target on a heading, a
paragraph or a row summary takes `size="inline"` and no bucket -- the Detail
View's Summary and Description triggers, and the Work Items Tree's row summary.
ADR-0019's "one editable document" survives only if the document does not turn
into a form.

**Menus are exempt.** A menu is already a committed context -- you opened it to
choose -- so a menu item that writes takes no fill.

**One exception, named on purpose: the FAB.** The floating create button carries
the `write` fill even though it opens a dialog, because it is the app's standing
invitation to create and has no label to carry that meaning. It is the one place
where a fill does not mean "this click commits".

Sizes use `min-h`, never a fixed `h`, so a button grows with its content rather
than clipping it: `default` is `min-h-9 px-4 py-2`, `sm` is `min-h-8 px-3`, `lg`
is `min-h-10 px-8`, `icon` is square, and `inline` drops padding, type size and
the coarse-pointer minimum so it can dress content. **`bare` and `inline` carry
`border border-transparent`** so they do not jump on hover. The focus ring is
offset (`ring-offset-2`) because it tracks `primary` and would otherwise sit
hard against an indigo edge.

### Chip

A control that is both the value and the control, in three places: the Search
tab's **Filter Chips**, the Detail View's **Property Chips**, and the Due tab's
scope. All three are `open` -- they name a value and tapping one opens a picker
-- and all three are **Set** when they name a value rather than `Any`,
`Unassigned` or `No Due Date`. **A Set chip is tinted** (`bg-accent`); an unset
one is not. Activeness never rests on colour alone: a chip reading `Any` is off
and one naming a value is on, whether or not the tint is perceived.

The Detail View's **Parent** chip is the exception, and never tinted: it always
names a parent (a Topic shows no Parent chip at all), so it has no unset state
to contrast against and a permanent tint would spend the accent on nothing.

### Input and Textarea
[input.tsx](app/components/ui/input.tsx) /
[textarea.tsx](app/components/ui/textarea.tsx). A `card` fill inside an `input`
border, with the same focus ring as everything else. The Detail View's free-text
fields commit on an explicit ✓ rather than on blur, so a textarea is a control
that holds uncommitted text by design -- never auto-save it.

### Field Label

A control's own caption, in either of HTML's two spellings: a `<label>` wrapping
a single control, or a `<legend>` naming a group of them. Both are `text-xs
font-medium` and both sit **8px above** what they name -- one rhythm, so a
grouped set of controls reads at the same density as a single field.

The two spellings do not reach that 8px the same way. A `<label className="grid
gap-2">` puts its caption in the grid, so the gap does the work. A **rendered
`<legend>` is excluded from its fieldset's formatting context** -- it is not a
grid item, so `gap` never reaches it and a `grid gap-2` fieldset silently draws
its legend flush against the first control. Use
[app/components/ui/fieldset.tsx](app/components/ui/fieldset.tsx) rather than a
bare `<fieldset>` / `<legend>` pair: `Fieldset` carries the `grid gap-2` and
`FieldsetLegend` carries the compensating `mb-2`. Native `<fieldset>` semantics
are kept -- the `group` role and its accessible name are worth more than the
layout convenience of swapping in a `<div role="group">`.

### Badge

[app/components/ui/badge.tsx](app/components/ui/badge.tsx), in two treatments
that are **deliberately different jobs, not two skins**:

| Variant  | Surface                                            | Use                                     |
| -------- | -------------------------------------------------- | --------------------------------------- |
| `status` | `muted` fill, hairline border, `micro-label` size  | Uppercase status micro-badge            |
| `chip`   | `muted` fill, `rounded-full`, `caption` size       | A Label, on the Detail View only        |

Labels and statuses are distinguished by **treatment, not hue**: a Label carries
no colour at all (ADR-0018), so a chip can never be mistaken for a status.

### Popover

[app/components/ui/popover.tsx](app/components/ui/popover.tsx), over Radix
Popover, wearing the same surface as a menu: `popover` fill, hairline border,
`rounded-lg`, `shadow-lg`, `sideOffset={4}`, portalled.

**A chip whose picker is a list of choices uses the Menu; one that holds a text
field uses this.** A Radix menu runs typeahead on every character key inside its
content, so a filter input in a menu fights the menu for the keystrokes. The
Parent chip's picker is the case that needs it.

### Dialog

[app/components/ui/dialog.tsx](app/components/ui/dialog.tsx), over Radix Dialog.
Floating and temporary, so it is one of the few surfaces allowed a shadow
(`shadow-lg`) and it uses `rounded-lg` with a `popover` fill. The close control
is a `lucide-react` `X` with an `sr-only` label.

**A dialog scrolls down, never sideways.** The inner region carries
`overflow-y-auto overflow-x-hidden overscroll-y-contain`: `overflow-y` alone
would compute `overflow-x` to `auto`, and iOS treats that as a horizontal
scrollport and rubber-bands it even when `scrollWidth` equals `clientWidth` --
the form slides sideways under a stationary close control with nothing to scroll
to. `overscroll-y-contain` keeps the vertical bounce, which is wanted, while
stopping the scroll chaining to the page behind. The axis is settled by
`overflow`, not by `touch-action`: this is a layout rule, and a `pan-y` gesture
lock would miss the trackpad and put the deliberate pinch-zoom at risk.

Two constraints follow, and the clip is a backstop for the first rather than a
cover for it. **Horizontal overflow inside a dialog is a layout defect**: text
that cannot wrap truncates at its own control and never pushes a row wide, so
the clip should never fire. And **floating UI inside a dialog must portal out**
-- a date picker popup or an autocomplete cannot rely on overflowing the panel,
because it will be clipped silently at the padding edge.

## design-lint

The token discipline, the closed type scale and the ban on `dark:` are
conventions a linter enforces; without one they decay quietly. `npm run
design-lint` is a **hard gate from day one, with no ratchet baseline** -- any
violation fails. Five rules:

1. **No raw Tailwind palette utilities** -- `bg-slate-50`, `text-blue-600`.
2. **No raw hex** -- `#fff`, `#4d41c8`.
3. **No `dark:` utilities**, stacked behind another variant or not.
4. **No arbitrary colour values** -- `bg-[#ff0000]`, `text-[rgb(…)]`,
   `bg-[var(--x)]`, `[color:…]`.
5. **No arbitrary font sizes**, with `text-[10px]` allowlisted as the one
   restricted role.

`prototypes/` sits outside the lint's source root -- prototype tickets exist to
break these rules and live on throwaway branches -- as does `public/offline.html`
(ADR-0029), which is hand-written, self-contained and monochrome.

**A few homes for the primary indigo are outside the token set and beyond the
lint's reach** (ADR-0030): the exported App Icon artwork, the manifest's
`theme_color: "#4d41c8"`, and the server-rendered document `theme-color` meta
values. Retuning the primary means re-exporting the icons and updating those
metadata literals in lockstep with `app.css`.

## Do's and Don'ts

- **Do** let a button's colour state its effect on stored data; **don't** ration
  `primary` by importance. A screen carries as many `write` fills as it has ways
  to change stored data.
- **Don't** hardcode colours -- no raw Tailwind colour utilities, no raw hex, no
  arbitrary colour values. Add a token first.
- **Don't** express status with raw colours. Use the four status roles.
- **Don't** give a Type Mark a circle or the colour blue -- the circle and the
  blue belong to status.
- **Don't** use raw neutral palettes (`gray-*`, `slate-*`, `zinc-*`). Use the
  semantic neutrals (`background`, `foreground`, `muted`, `border`).
- **Don't** write a `dark:` utility, and **don't** read the theme from
  JavaScript. The token block redefines itself per mode.
- **Do** keep ordinary text at `text-xs` (12px) or larger; **don't** use smaller
  text except `micro-label` for its stated reasons.
- **Don't** use arbitrary one-off sizes (`text-[13px]`, `gap-[7px]`). Stay on the
  type roles and the 4px spacing scale.
- **Do** express the 44px coarse-pointer minimum inside a primitive; **never** at
  a call site.
- **Do** convey depth with tone and border; reserve shadows for floating
  overlays.
- **Don't** turn a typography role into a component or an `@utility` alias. The
  recipe is what you type.
- **Do** treat the absent families (chart ramp, computed borders, serif /
  signature / mono, `--label-1..8`) as decisions. Adding one back is an ADR, not
  a commit.
