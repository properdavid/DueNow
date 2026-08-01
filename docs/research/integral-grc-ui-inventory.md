# integral-grc UI inventory

Research output for [Inventory integral-grc for responsive UI modules](https://github.com/properdavid/DueNow/issues/3).

**Source:** `~/Projects/grace-domain-model/repos/integral-grc` — LinkedIn's GRC platform. All paths below are relative to that repo root; the React app lives at `apps/integral-grc/`, its source at `apps/integral-grc/app/src/`.

**Purpose:** a shopping list later prototype tickets can buy from. This is an inventory, not a design — it records what exists and whether it ports, not what DueNow should do.

---

## 0. Headline findings

Four things matter more than the rest of this document:

1. **There is no bottom tab bar.** integral-grc's mobile navigation is the desktop sidebar rendered as a Radix `Sheet` overlay behind a hamburger. DueNow's phone expression — a 4-tab bottom bar — has **no precedent here and must be designed from scratch.**
2. **Desktop is the design centre; mobile is a fallback.** Dense tables are `min-w-[1400px]` inside a horizontal scroller. There is no card/list reflow for narrow screens. integral-grc is a reference for *desktop* density, not for genuinely first-class phone UX.
3. **The design system is the strongest asset.** `DESIGN.md` + `index.css` + `design-lint.mjs` is a complete, portable, domain-free token system with an enforcement mechanism. This is the single highest-value thing to borrow.
4. **The stack is a near-match.** React Router v7 SSR, Radix, shadcn-style components, CVA, `cn`, react-hook-form + zod, lucide, vitest. The main gap is Tailwind: integral-grc is on **v3.4 with a `tailwind.config.ts`**, DueNow targets **v4 CSS-first**. Token *values* port directly; the config syntax does not.

---

## 1. The navigation shell

### Composition

`apps/integral-grc/app/root.tsx` (lines ~295–350) is the whole shell — there are no layout routes. `app/routes.ts` is three lines of `@react-router/fs-routes`.

```
<QueryClientProvider><ThemeProvider><TooltipProvider><SidebarProvider>
  <div className="flex flex-col h-screen w-full">
    <header>  fixed top-0 z-50, h-14 — SidebarTrigger + title + ThemeToggle
    <div className="flex flex-1 overflow-hidden min-w-0 pt-14">
      <AppSidebar />
      <SidebarInset><main>{children}</main></SidebarInset>
```

The header colour comes from `APP_ENVIRONMENT` config (dev/staging/prod tinting). The root loader does TrustBridge SSO and a gRPC `resolveUser()` — LinkedIn-only.

### The sidebar primitive

`app/src/components/ui/sidebar.tsx` (727 lines) — the shadcn sidebar, essentially unmodified. This is the most substantial portable piece.

```ts
type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean; setOpen: (open: boolean) => void;
  openMobile: boolean; setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

<Sidebar
  side="left" | "right"
  variant="sidebar" | "floating" | "inset"
  collapsible="offcanvas" | "icon" | "none"
/>
```

What it gives you:

- **Cookie persistence** — `sidebar_state`, `max-age` 7 days, written on every toggle.
- **`Cmd/Ctrl+B`** to toggle, bound in a `useEffect` in the provider.
- **Mobile fallback** — when `isMobile`, renders a Radix `Sheet` from the left at `--sidebar-width-mobile` instead of the fixed rail.
- **CSS vars** — `--sidebar-width: 16rem`, `--sidebar-width-icon: 3rem`, `--sidebar-width-mobile: 18rem`.
- **Collapsed tooltips** — `SidebarMenuButton tooltip={...}` renders a right-side tooltip only when `state === "collapsed" && !isMobile`.
- **Mobile hit areas** — `after:absolute after:-inset-2 md:after:hidden` expands touch targets below `md`.

Exported parts: `SidebarProvider`, `Sidebar`, `SidebarTrigger`, `SidebarRail`, `SidebarInset`, `SidebarHeader/Content/Footer/Separator`, `SidebarGroup*`, `SidebarMenu*` (incl. `SidebarMenuBadge`, `SidebarMenuSkeleton`), `SidebarMenuSub*`, `SidebarInput`, `useSidebar()`.

### Responsive strategy

`app/src/hooks/use-mobile.tsx` — 22 lines, one breakpoint:

```ts
const MOBILE_BREAKPOINT = 768;            // === Tailwind md
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);  // false on SSR → hydration-safe
  React.useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const mql = window.matchMedia("(max-width: 767px)");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}
```

There is a second one, `useIsLargeScreen()`, used by `governance-tree-split.tsx`.

The split of responsibility is consistent and worth copying:

- **JS breakpoint (`useIsMobile`)** only where the two variants are *structurally different components* — sidebar-as-rail vs sidebar-as-Sheet, split-pane vs stacked.
- **CSS (`md:` prefixes)** for everything that is the same component reflowing — `grid-cols-1 md:grid-cols-2`, `md:items-start`.

Tailwind's default breakpoints are unmodified (640/768/1024/1280). Note the SSR consequence: `useIsMobile` returns `false` on the server, so the desktop variant is what gets server-rendered and the mobile one appears after hydration.

### Desktop chrome

| Piece | Path | Notes |
| --- | --- | --- |
| Breadcrumbs | `components/breadcrumb.tsx` (117 lines) | Radix slot-based; `Breadcrumb`, `List`, `Item`, `Link`, `Page`, `Separator`, `Ellipsis`. `components/breadcrumb-segments.tsx` is the domain-aware caller. |
| Horizontal tabs | `components/tab-bar.tsx` (168 lines) | WAI-ARIA tabs, roving tabindex, arrow/Home/End keys, `activation: "automatic" \| "manual"`, `size: "default" \| "sm"`. **Within-page tabs, not navigation.** |
| Split panes | `components/ui/resizable.tsx` (46 lines) | Thin wrapper over `react-resizable-panels` v2.1.7. |
| Command palette | `components/ui/command.tsx` (152 lines) | `cmdk` v1.1.1 wrapped in a Dialog. **Present but never mounted** — no global Cmd+K in this app. Used only to power comboboxes. |
| Theme toggle | `components/theme-toggle.tsx` | Toggles `.dark` on `<html>`. |

### Mobile navigation

Sidebar-as-Sheet, triggered from the header hamburger, closing on navigation. That is the entire story. **No bottom tab bar, no mobile-specific information architecture, no per-device-class route variants.**

### Verdict

| Piece | Verdict |
| --- | --- |
| `ui/sidebar.tsx` + `useSidebar` | **Portable** — copy wholesale |
| `hooks/use-mobile.tsx` | **Portable** — copy, consider a second tablet breakpoint |
| `breadcrumb.tsx` | **Portable** |
| `tab-bar.tsx` | **Portable** (in-page tabs) |
| `ui/resizable.tsx` | **Portable** |
| `ui/command.tsx` | **Portable** — and unlike here, worth actually mounting |
| `root.tsx` Layout skeleton | **Rework** — shape is sound; auth, env-coloured header and impersonation banner are LinkedIn |
| `app-sidebar.tsx` | **Not portable** — ~300 lines of permission-gated module nav (PS/OB/CS/MT/CE/AA/AD/MY, `usePermissions()`, `hasPsAtLeast()`) |
| `hooks/use-permissions.ts`, auth, `ImpersonationBanner` | **Not portable** — TrustBridge/whodis/gRPC |
| Bottom tab bar | **Does not exist** |

---

## 2. The UI module library

### Layering

Three layers, cleanly separated:

1. **`app/src/components/ui/`** — 48 files. Stock shadcn/Radix primitives: button, dialog, sheet, drawer, form, table, select, popover, command, tooltip, toast, skeleton, resizable, sidebar, calendar, chart, etc. Domain-free.
2. **`app/src/components/*.tsx`** — 107 files, flat. Composed modules, ranging from generic (`tab-bar`, `breadcrumb`, `table-pagination`) to fully domain-bound (`accm-suggestion-panel`, `control-health-card`).
3. **`app/src/pages/<MODULE>/`** — screens per bounded context (PS, OB, CS, MT, CE, AA, AD, MY, RM), each with its own `CONTEXT.md` glossary.

Roughly 177 `.tsx` component files, ~32k LOC. A conservative read is that **40–50% is reusable**, and nearly all of the safely-reusable part is layer 1.

### Catalogue

**Forms** — `ui/form.tsx` is the shadcn react-hook-form wrapper: `Form` (= `FormProvider`), `FormField` (Controller + a name context), `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, and a `useFormField()` hook that derives `formItemId` / `formDescriptionId` / `formMessageId` and wires `aria-describedby` and `aria-invalid` automatically. With `@hookform/resolvers` + zod. `ItgcFormDialog.tsx` is a good worked example of dialog + form + zod. **Portable** (the wrapper; the schemas obviously not).

**Trees** — three, and none of them ports cleanly:
- `governance-tree.tsx` — the main tree. Assumes `PolicyWithChildren` / `StandardWithChildren` / `ObligationWithChildren` with `treeDisplayHandle`, `treeDescriptionSnippet`, `isFlagDeprecate`, `lastApprovalRejectionComment`. Expand/collapse state and search highlighting are worth reading; the data shape is not reusable.
- `governance-tree-split.tsx` — **the most directly relevant component in the repo.** Tree left, detail right, responsive:
  ```tsx
  export function GovernanceTreeSplit({ left, right, className }) {
    const isLarge = useIsLargeScreen();
    if (!isLarge) return <div className="grid grid-cols-1">{left}{right}</div>;
    return (
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={40} minSize={25}>{left}</ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={60} minSize={30}>{right}</ResizablePanel>
      </ResizablePanelGroup>
    );
  }
  ```
  Note what the narrow branch does: it **stacks both panes**, it does not push the detail to a separate route. That is a real decision DueNow will have to make differently or deliberately copy. **Portable.**
- `entity-tree-selector.tsx` — hierarchical picker across entity types; `TreeNode` is generically shaped (`id`, `name?`, `parentId?`). Closest thing to an off-the-shelf parent-picker. **Portable.**

`@dnd-kit` v6.3.1 is a dependency but is barely used — **there is no drag-to-reparent precedent here.**

**Dialogs / panels** — `ui/dialog.tsx`, `ui/sheet.tsx`, `ui/drawer.tsx` (vaul) all stock. `object-audit-history-sheet.tsx` is a decent side-panel-of-timestamped-diffs pattern. Export dialogs (`export-dialog.tsx`, `controls-export-dialog.tsx`) follow scope-selector + format-chooser + column-picker.

**Status vocabulary** — `governance-status-icons.tsx` encodes a **glyph precedence rule** (highest-priority state wins, rejection is an additive cue on top). The specific glyphs are GitHub PR icons mapped to PCR lifecycle states and are useless to DueNow, but the precedence idea is the transferable part. `health-icons.tsx` similarly. `constants/enums.ts` uses a `as const` map from proto enum name to display label — a decent pattern for status labels.

**Wizards** — `bulk-wizard/bulk-operation-wizard.tsx` is a genuinely generic three-phase state machine (configure → validate → confirm) parameterised over `TPayload`, taking `checkDefs: ValidationCheck[]` and a `runValidation` callback. Four domain wizards build on it. **Portable framework, domain callbacks rewritten.** Probably beyond v1 scope, but noted.

**Rich text** — `rich-text-editor.tsx` on TipTap v3.22 (starter kit, link, table, text-align, underline, colour). Heavy. Relevant only if work item descriptions want more than plain text/markdown.

**States** — `ui/skeleton.tsx` for loading (tables render 5 skeleton rows); empty states are a single `<TableRow colSpan>` with a *contextual* message rather than one generic "no results" — e.g. "No controls yet. Click 'Add Control' to create one." vs "No controls match your filters." That distinction is a small, cheap, high-value habit to copy.

**Toasts** — `ui/toast.tsx` + `hooks/use-toast.ts` + Radix Toast. Mutations report success/failure via toast.

### Composition conventions

Components are **presentational with props**, but the data flow is *not* what you would expect from React Router v7:

- Pages fetch through **TanStack Query (`useQuery`)**, not through loaders. Loaders are thinly used; `initialControls` is sometimes passed as a prop with `useQuery` as the fallback.
- Mutations use `useMutation` + `grpcMutation()` → `POST /api/grpc` → integral-svc. **No `useFetcher`, no optimistic UI anywhere.**

DueNow on SQLite/Drizzle with no network hop should almost certainly use loaders/actions/`useFetcher` instead — so **integral-grc's data-flow conventions are the least portable part of its component design**, even though the components themselves are fine.

### Testing

Vitest + happy-dom + `@testing-library/react`; tests under `apps/integral-grc/__tests__/`. `yarn test`, `test:watch`, `test:coverage`. Conventional; portable as a setup.

### Portability verdict

**Copy as-is:** the 48 `ui/` primitives, `lib/utils.ts` (`cn`), `lib/errors.ts` (`toErrorMessage`), `lib/logger.ts`, `lib/format-date.ts`, `hooks/use-pagination.ts`, `hooks/use-toast.ts`, the vitest setup.

**Rework:** `governance-tree-split` (trivial), `entity-tree-selector` (near-zero), status icons (keep precedence, replace glyphs), audit history sheet, export dialog, bulk wizard shell, form-in-dialog pattern.

**Skip:** `governance-tree` data layer, `controls-table` data layer, `app-sidebar`, `approval/`, `accm-suggestion-panel`, `ad-ownership` / `ad-entity-relations` (role hierarchies and compliance link types), all `pages/`, all gRPC/proto/auth.

---

## 3. Styling and design tokens

### Tailwind version — the one real migration cost

integral-grc is on **Tailwind 3.4.19** (patched, via a yarn patch), with a v3-style `tailwind.config.ts` using `theme.extend` and `darkMode: ["class"]`. Colours are exposed as `hsl(var(--X) / <alpha-value>)`, which is what makes `bg-primary/80` work.

Porting to **Tailwind v4** means:

- `tailwind.config.ts` → `@theme` in CSS. The token *values* move over unchanged; only the declaration site changes.
- `darkMode: ["class"]` → `@custom-variant dark (&:where(.dark, .dark *))`.
- The `hsl(var(--X) / <alpha-value>)` indirection is unnecessary in v4 — declare the colour directly in `@theme` and v4 handles alpha.
- The yarn patch is local and irrelevant.

This is a mechanical migration, not a redesign. **The token system is fully portable; the config file is not.**

### Tokens

Declared as CSS custom properties in `:root` and `.dark` in `app/src/index.css`, **HSL triplets** (`220 53% 49%`), class-based dark mode only — no `prefers-color-scheme`.

Families:

- **Brand/surface:** `--primary`, `--primary-foreground`, `--background`, `--foreground`, `--card`, `--card-foreground`, `--card-border`, `--popover`, `--sidebar`, `--sidebar-foreground`, `--sidebar-border`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--border`, `--input`, `--ring`.
- **Status, each with `-foreground` and `-subtle`:** `--success` (142 71% 40%), `--warning` (38 92% 45%), `--info` (184 80% 35% — deliberately teal so it can never be confused with the 220-hue primary), `--destructive` (0 84% 60%). The `-subtle` variants invert across modes: ~95% lightness in light, a low-lightness tint of the same hue in dark.
- **Chart ramp:** `--chart-1..5`.
- **Tag palette:** `--tag-1..8`, curated to avoid collision with status colours — user-pickable, so they must never read as "this is an error".
- **Elevation overlays:** `--elevate-1` (`rgba(0,0,0,.03)` / `rgba(255,255,255,.04)`), `--elevate-2` (`.08` / `.09`), plus `--button-outline`, `--badge-outline`. Driven by utility classes `hover-elevate` / `active-elevate-2` baked into the button base class.
- **Shadows:** full `--shadow-2xs` … `--shadow-2xl` ramp.
- **Computed borders:** `--primary-border` etc., derived via `hsl(from ...)` darkened by `--opaque-button-border-intensity` (−8 light, +9 dark), with fallbacks.
- **Fonts:** `--font-sans: Inter`, `--font-mono: JetBrains Mono`, `--font-serif: Georgia`, `--font-signature: Caveat` (self-hosted woff2, OFL).

### Typography — role → recipe

The most immediately copyable table in the repo. The recipe *is* the class string engineers type; there is no `<Heading>` component.

| Role | Recipe | Use |
| --- | --- | --- |
| `heading-page` | `text-xl font-semibold` | Page title — one per page |
| `heading-section` | `text-lg font-semibold` | Major section |
| `heading-sub` | `text-base font-medium` | Sub-section / card title |
| `body` | `text-sm` | **Default body and table text** |
| `body-strong` | `text-sm font-medium` | Emphasised body |
| `caption` | `text-xs` | Helper/metadata — **floor for ordinary text** |
| `micro` | `text-[11px]` | Dense embedded tables, chart legends — restricted |
| `micro-label` | `text-[10px] font-bold uppercase tracking-wide` | Avatar initials, compact badges, eyebrow labels — restricted |
| `mono` | `font-mono` | Code, hashes, identifiers |

Note `body` is 14px, not 16px — that is the density decision in a nutshell, and it has real implications for a phone-first surface. Arbitrary sizes (`text-[13px]`) are banned outside the two restricted roles.

### Density

Spacing uses the **native Tailwind 4px scale with no semantic aliases** — engineers type `gap-2` directly. Conventions:

| Context | Value |
| --- | --- |
| Related controls in a row | `gap-2` (8px) |
| Distinct control groups | `gap-4` (16px) |
| Stacked page sections | `space-y-6` (24px) |
| Card padding | `p-6` |
| Page content region | `p-6` |
| Page header region | `p-4` + `border-b` |

Table cells run `py-1`/`py-2`; badges in dense rows use `py-0` with `micro-label` so they don't expand the row. Button `sm` is `min-h-8 px-3 text-xs`, default is `min-h-9 px-4 py-2` — note `min-h` rather than fixed `h`.

**Elevation policy:** hierarchy comes from *tone and hairline borders*, not shadow — `background` → `card`/`popover` with a border, `muted`/`accent` as intermediate steps. **Shadows are reserved exclusively for floating, temporary UI** (dropdowns, dialogs, popovers, toasts). Nothing in normal flow casts a shadow. This single rule does most of the work in making it read as "professional" rather than "consumer app".

### Radix wrapping

Standard shadcn: CVA + `cn` + `asChild`/Slot.

```ts
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium " +
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring " +
  "disabled:pointer-events-none disabled:opacity-50 " +
  "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2",
  { variants: {
      variant: { default: "bg-primary text-primary-foreground border border-primary-border", destructive: …, outline: "border [border-color:var(--button-outline)] shadow-xs active:shadow-none", secondary: …, ghost: "border border-transparent" },
      size: { default: "min-h-9 px-4 py-2", sm: "min-h-8 rounded-md px-3 text-xs", lg: "min-h-10 rounded-md px-8", icon: "h-9 w-9" } },
    defaultVariants: { variant: "default", size: "default" } },
);
```

```ts
// lib/utils.ts — 7 lines
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

Conventions worth adopting verbatim: **focus is `focus-visible:ring-1 focus-visible:ring-ring`** (thin, token-coloured, keyboard-only); disabled is `disabled:pointer-events-none disabled:opacity-50`; `ghost` still carries `border border-transparent` so it doesn't jump on hover; alerts render as `subtle` fill + `/40` border + tinted icon (`bg-info-subtle border-info/40 [&>svg]:text-info`); active tabs use `border-b-2 border-primary` with `ring-inset` focus to avoid overflow clipping.

Icons are **lucide-react** — portable.

### design-lint — the enforcement mechanism

`apps/integral-grc/scripts/design-lint.mjs`, ~150 lines, **zero dependencies** (`node:fs`, `node:path`, `node:url` only). Two rules:

1. **No raw Tailwind palette utilities** — bans `bg-slate-50`, `text-blue-600`, etc. by regex over `(bg|text|border|ring|fill|stroke)-(slate|gray|red|…)-(50…950)`.
2. **No raw hex** — bans `#fff`, `#ffffff`, `#rrggbbaa`.

With a narrow allowlist for genuine content-data colour (the tag colour picker, rich-text colour swatches, sanitised-HTML table borders).

The clever part is the **ratchet baseline**: `design-lint-baseline.json` records current violations, and a run fails only when the count *exceeds* baseline. Modules get migrated by deleting their baseline entries; when the baseline empties it becomes a hard gate. `yarn design-lint` / `yarn design-lint:update`.

**Fully portable**, and cheap — adjust `srcRoot` and the allowlist. Adopting it on day one of a greenfield repo means the baseline starts empty and it is a hard gate immediately.

### Not portable

LinkedIn internal packages (Kafka, proto tooling, `config/external/.linkedin`), TrustBridge auth, the env-coloured header. The Caveat font is OFL so it can be self-hosted, but is probably unwanted. **Nothing in the token system, typography scale, density rules, or lint script is LinkedIn-specific.**

---

## 4. Dense data views

### There is no table library

**No TanStack Table.** `@tanstack/react-query` is present; `@tanstack/react-table` is not. Tables are semantic HTML built on `ui/table.tsx`, which exports the primitives plus three utility class constants:

- `STICKY_TABLE_HEADER_CLASS` — `"sticky-list-thead [&_th]:sticky [&_th]:top-0 [&_th]:z-10 …"`
- `TABLE_WIDE_SCROLL_WRAP_CLASS` — `"min-w-0 overflow-x-auto"`
- `STICKY_LIST_TABLE_SCROLL_CLASS` — flex-1 / min-h-0 / overflow-auto / rounded border scroll port

Everything else is per-domain: `controls-table.tsx` (~1374 lines), `assignments-table.tsx`, `obligations-table.tsx`, `systems-table.tsx`, `metrics-table.tsx`, `roles-table.tsx`, `oversight-table.tsx`. Each re-implements its own filter/sort/paginate. **There is no shared table controller** — this is duplication, not a pattern to copy.

Columns are **inline JSX**, not column definitions:

```tsx
<TableHead className="min-w-[350px]">
  <button onClick={() => handleSort("description")} className="flex items-center gap-1">
    Description {getSortIcon("description")}
  </button>
</TableHead>
```

Consequently there is **no column visibility, reordering, resizing, or pinning**, no row selection in the base, and **no virtualization** — pagination keeps the DOM small instead. Overflowing cell text uses `line-clamp-3` with a `recalcOverflow` measurement.

**Narrow screens:** `min-w-[1400px]` + horizontal scroll. No card/list reflow, no column hiding. This is the clearest place where integral-grc is *not* a model for DueNow.

### Filtering

`ui/multi-select-filter.tsx` is the workhorse: Radix Popover + cmdk `Command` + checkboxes, with a `minSearchChars` option that refuses to mount options until the user types N characters (used for the owner filter, which would otherwise render thousands of `CommandItem`s). **Portable** given Radix + cmdk.

`aa-attestation-query-builder.tsx` is a field/operator/value condition builder — but the fields, operators and enums are hardcoded attestation-scope concepts. **Not a generic query builder; not portable.**

Filter state is the interesting part, and it is layered:

1. `useState` per filter,
2. serialised as JSON into **`sessionStorage`** under a per-page key (`controls-list-filters`, `my-controls-list-filters`) on every change,
3. optionally encoded **base64url into a `?cf=` search param** for shareable links (`lib/controls-list-link-state.ts`, `encodeControlsListCf` / `parseCfFromSearchParams`), triggered by an explicit "Copy Link" button.

Crucially: **all filtering is client-side over a fully-fetched dataset.** Nothing round-trips through a loader. That is viable at GRC's data sizes and trivially viable at household sizes — but it means integral-grc offers **no precedent for URL-as-filter-state driving server-side queries**, which is the more idiomatic React Router v7 approach and probably the better fit for a Search tab.

### Sorting, grouping, search

**Sorting:** client-side, **single-column only**. `sortField` + `sortDirection`; clicking the active header flips direction, clicking another resets to ascending; `getSortIcon()` returns `ArrowUpDown` / `ArrowUp` / `ArrowDown`. No multi-sort.

**Grouping:** exists in exactly one place, `oversight-table.tsx`, as a tree-in-table with a `GroupingPreset { id, label, dimensions: GroupByDimension[] }` shape and dimensions like area / sub-area / owner / programme, rendered recursively with per-dimension colour tinting and inline pills capped at 3 + "+N". Conceptually the closest thing to grouped work items, but bound to `OversightNode`. **Rework at best.**

**Search:** a plain `<Input>` doing **undebounced** client-side substring matching across several fields inside a `useMemo`, with an X to clear. cmdk handles its own input debouncing inside comboboxes. There is **no global command palette** despite `ui/command.tsx` existing.

### Saved views and export

Session-scoped view state (above) plus the `?cf=` shareable link is the whole "saved views" story — there are no named, persisted views. Export is `controls-export-dialog.tsx`: format (xlsx/csv/json) × scope (all/filtered, snapshotting `filteredControlIds` at click time) × 16 toggleable columns with three locked. It POSTs to `/api/controls-export` and downloads a blob using the `x-filename` response header — **server-side serialisation, no client-side generation.** Pattern portable, columns not.

### Pagination

`hooks/use-pagination.ts` — generic, client-side, 20–25 default page size. `hooks/use-server-pagination.ts` — cursor-based with a token-history stack for going backwards. `components/table-pagination.tsx` — dumb "Showing X–Y of Z" + prev/next. All three **portable**.

### Verdict

| Pattern | Verdict |
| --- | --- |
| `ui/table.tsx` + sticky/scroll class constants | **Portable** |
| `use-pagination` / `use-server-pagination` / `table-pagination` | **Portable** |
| `multi-select-filter.tsx` | **Portable** (needs Radix + cmdk) |
| sessionStorage filter serialisation | **Portable** pattern |
| base64url `?cf=` shareable view links | **Portable** pattern, domain schema rewritten |
| Per-domain table components | **Rework** — copy the filter/sort/search *shape*, not the code |
| Export dialog | **Rework** — needs a server serialisation endpoint |
| `oversight-table` grouping/tree | **Not portable** |
| `aa-attestation-query-builder` | **Not portable** |
| Responsive card/list fallback | **Does not exist** |
| Virtualization | **Does not exist** |
| gRPC mutation layer | **Not portable** |

---

## 5. Gaps DueNow must solve without a reference

Recording these explicitly, because absence is a finding:

1. **Bottom tab bar and phone-first IA.** No precedent.
2. **Narrow-screen behaviour for dense lists.** integral-grc horizontal-scrolls a 1400px table. DueNow needs a real answer (card reflow? column priority? a different component per breakpoint?).
3. **Master/detail routing on phones.** `governance-tree-split` *stacks* both panes when narrow rather than routing to a detail screen. For a work item detail view this is likely the wrong call and needs its own decision.
4. **Loader/action data flow.** integral-grc uses TanStack Query over gRPC and never uses `useFetcher` or optimistic UI. On SQLite there is no reason to; DueNow's conventions have to be invented rather than borrowed.
5. **Drag-and-drop reparenting.** `@dnd-kit` is installed but essentially unused.
6. **PWA / offline.** No `vite-plugin-pwa`, no service worker, no offline story at all.
7. **Tailwind v4 idiom.** All recipes here are v3-authored.

---

## 6. Recommended shopping list

**Buy outright:** the `ui/` primitives that are actually needed (not all 48), `lib/utils.ts`, `hooks/use-mobile.tsx`, `ui/sidebar.tsx`, `ui/resizable.tsx` + `governance-tree-split` shape, `breadcrumb.tsx`, `tab-bar.tsx`, `ui/command.tsx`, `use-pagination.ts`, `table-pagination.tsx`, `multi-select-filter.tsx`, the vitest setup.

**Buy the conventions, retype the code:** the token families and their HSL values, the typography role→recipe table, the spacing/density table, the tone-not-shadow elevation rule, the focus-ring convention, contextual empty-state messages, the `as const` status-label map.

**Buy the discipline:** `design-lint.mjs` with an empty baseline from day one.

**Do not buy:** anything under `pages/`, `app-sidebar.tsx`, `approval/`, the gRPC/TanStack-Query data layer, the per-domain tables, the horizontal-scroll approach to narrow screens.
