# The URL is the screen, and mutations are verb-shaped resource routes

A work item is addressed by a **path segment under a tab**, and every mutation is its own **resource route named for its verb**. Reads belong to route loaders; writes belong to `/api/…` actions driven by fetchers.

## The route table

```ts
route("/login", "routes/login.tsx"),
route("/auth/google", "routes/auth.google.tsx"),
route("/auth/google/callback", "routes/auth.google-callback.tsx"),
route("/auth/logout", "routes/auth.logout.tsx"),

layout("routes/shell.tsx", [                    // pathless: requireUser + nav chrome
  index("routes/home.tsx"),                     // redirect → /due
  route("due", "routes/due.tsx", [
    route(":id", "routes/work-item.tsx", { id: "due-item" }),
  ]),
  route("items", "routes/items.tsx", [
    route(":id", "routes/work-item.tsx", { id: "items-item" }),
  ]),
  route("search", "routes/search.tsx", [
    route(":id", "routes/work-item.tsx", { id: "search-item" }),
  ]),
  route("settings", "routes/settings.tsx"),
]),
```

**One detail route module, mounted three times.** The parent renders its tab's list and an `<Outlet/>`, so the Split Layout of ADR-0017 *is* the route pair — list column is the parent, detail column is the outlet — and the Compact Layout renders the same outlet as a full-screen push, where "back" is the browser's back to the parent path. Opening a Search row replaces the table with `/search/:id` and *Back to results* returns the query intact, because the query string never left the URL (ADR-0012, ADR-0021).

**`/items/:id` is also the canonical address.** The Work Items tab is the browse surface, so there is no separate `/browse/:id`: a link that arrives from outside, and every post-create navigation, lands on the one list that contains every work item unconditionally. JIRA's two-address idea is kept and its encoding is not — JIRA puts the selection in a query parameter (`&selectedIssue=`) because its in-context detail is a *modal over* the list, and it needs `/browse/KEY` because an issue key is spoken aloud. DueNow's Detail View is a screen with its own breadcrumb and back control (ADR-0019), and its `#` is a bare integer nobody says out loud (ADR-0021).

The id is a **path segment rather than a query parameter** so the Detail View gets its own loader, error boundary and pending state. As `?selected=12` the tab's loader would have to load the list *and* the item, so changing a Search filter would re-fetch the open item, and the route seam would test one conditional loader per tab instead of one detail loader once.

**The shell is a pathless layout route**, so `requireUser` and the nav chrome are written once and the auth routes sit outside it; `root.tsx` returns to document and providers only. Supportive branches on the root loader instead and has no layout route at all, which the inventory flagged as not stretching this far.

**Search opts out by declaring it, not by sitting elsewhere in the tree.** `export const handle = { layout: "full" }` on `search.tsx`; the shell reads `useMatches()` and renders the split or doesn't. Hoisting Search out of the layout would cost it the nav — it keeps the sidebar and the capsule and loses only the two-column pairing — and would make it a second shell to maintain, where a declared flag is the first-class capability ADR-0021 asked for.

**Landing on `/items/:id` expands that item's ancestor chain and nothing else.** ADR-0018's "opens fully collapsed" describes `/items` with no id, which is untouched. With an id the URL is asserting something about the screen, and revealing the row it names is the list column agreeing with the detail column, not a remembered preference sneaking back in.

## The mutation surface

Mutations **cannot** live on page routes: the detail route is mounted at three paths, so posting to "the current route" would mean three endpoints for one act, and the creation dialog opens from the action button, the sidebar, the tree's row `⋯` menu and the Detail View's "Add \<child rung\>" (ADR-0017, ADR-0018, ADR-0019), so it has no single page to post to at all.

**One resource route per verb**, under `/api/`, each a thin typed action that parses, validates, calls the domain verb and returns: `create`, `settle`, `start`, `reparent`, `field`, label attach/detach, comment add/edit/delete, and Settings' label, timezone and theme writes. Supportive's inherited `api.<thing>.tsx` + `intent` dispatch was rejected — the inventory flagged it for exactly this shape of app — because the verbs are not alike enough to share a preamble (`settle` carries the confirmed-sweep contract, `reparent` validates a target and may fire the Start Cascade, `field` validates per field), because the URL becomes the mutation's identity so `useFetcher({ key })` gives per-verb pending state, and because the route seam then tests one action per file rather than reaching every branch through an `intent`. The cost is roughly fourteen small files and fourteen lines of route config, which explicit config-based routing makes visible rather than noisy.

**Expected failures return; exceptional failures throw.** Anything fixable by typing or picking differently — empty or over-long Summary, a parent that breaks the ladder, an unparseable date — returns HTTP 200 with `{ ok: false, error: { field?, message } }`, so it lands in `fetcher.data`, the ✓/✕ editor keeps its text and the chip popover stays open. No session throws `redirect("/login")`; an unknown id or another author's comment throws 404 or 403 to the error boundary. Supportive throws bare `Response`s for validation failures, which would replace the screen — and the text being typed — for a 200-character overrun.

**The Settle Confirmation reads from the detail loader and instructs with a status, not a list.** The loader carries the item's unfinished subtree (four rungs, a household's worth of rows), so the popover opens with no round trip and the "nothing to sweep, commit straight through" path stays the fast one. The client posts `id`, the chosen status and `confirmed`, never the descendant ids: the server recomputes the sweep in the pure tree module inside the transaction (ADR-0003, ADR-0011). A client-supplied set could sweep a stale one, which is the failure mode that silently corrupts the tree.

**Reference data is loaded once by the shell.** The two household members, the Label vocabulary, the Household Timezone and the current user with their theme come down from the shell loader, which already runs on every page, so an assignee or label popover opens without fetching and ADR-0015's theme class is present at SSR. **Parent candidates do not**: the picker shared by reparenting, the creation dialog and Search's parent filter (ADR-0016, ADR-0021) is a GET resource route, `/api/parents?type=…&q=…`, fetched when the picker opens — type-filtered server-side so the list is only valid parents, each with its lineage. In a page loader every tab would pay for a picker that usually is not opened.

## Consequences

**Creating a work item navigates to `/items/:newId`**, wherever it was fired from — the tree is the one list guaranteed to contain it, and creation gets one outcome instead of four. The exception is **"Add \<child rung\>" from the Detail View's children checklist, which stays put and revalidates**: that entry point is a quick-add in context, and leaving the parent you are describing to look at the Subtask you just made is the worse outcome.

**One work item has three legitimate URLs.** `/due/12`, `/items/12` and `/search/12` render the same component with a different list beside it. Sharing a link means sharing whichever tab you were in; `/items/12` is the one to normalise to.

**Nothing is optimistic.** Self-hosted against synchronous `better-sqlite3`, the round trip is single-digit milliseconds, and optimistic state for a cascade would mean reimplementing it client-side — the duplication ADR-0011 exists to prevent. Controls show pending state, and React Router's revalidation after a fetcher submit is what refreshes the tree row, the Due card and the Detail View together, which is what a cascade needs.

**There is no no-JavaScript path.** Mutations are `useFetcher`, not `<Form>`. Supporting one would mean a second UX for every cascade confirmation and every Property Chip, for an installed PWA serving two people.

**A small race is accepted at the Settle Confirmation.** If a Subtask is added between the popover rendering and the confirmation, the server sweeps one item more than the popover named. Sending expected ids and rejecting on mismatch would turn a routine act into a conflict dialog, and the mismatch it guards against is a *correct* cascade under the Terminal Subtree Invariant.
