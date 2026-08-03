# The Search tab is a full-window table

The Search tab renders its results as a **table**: one row per work item, seven columns — `#`, Summary, Parent, Assignee, Status, Due, Updated — with the type carried as an icon inside the Summary cell. On a wide screen it **takes the whole window**, overriding ADR-0017's split: there is no sidebar-list-and-detail pairing on this tab, because seven columns cannot be paid for out of a 500-pixel list column. Opening a row **replaces** the table with the work item's detail view, behind a *← Back to results*.

This is the JIRA issue navigator's shape, minus its two-pane variant, and it is deliberate. Search is the surface where the household goes looking across everything at once, and comparing rows is most of the act — which wants columns, alignment and as many rows on screen as the display can hold. A list that keeps the detail pane beside it is optimising for reading one item, which is what the Work Items tree and the Due tab already do.

Two alternatives were built and lost. A **console** — a permanent facet rail down the left with live counts on every value, applying instantly, staying inside the split — reads the whole filter state without opening anything and is the fastest to explore with, but the rail and the results then share one column, and the results lose more width than the rail's always-on visibility is worth. A **query bar** — a keyword box and a `+ Filter` button, each filter becoming a removable chip, with identical rows at every width and no table at all — is the least chrome and the only variant with one layout to build, but it never uses a wide screen for anything, and the rows it shows at 1440 points are the rows it shows at 390.

## The columns

`#` is kept. It is a bare integer nobody will say out loud — DueNow has no `PROJ-142` key — but it costs almost nothing, and it is the visible expression of the default order, which is creation order.

**Parent is the immediate parent only**, as ADR-0012 already decided, and the full window does not reopen it: summaries get long by themselves, and a Subtask printing `House › Replace Patio Cover › Get patio cover quotes` would compound that in the one column that exists to disambiguate, not to narrate.

**Labels appear nowhere in the table.** They remain a filter dimension, but ADR-0018 put their display on the detail view alone, and that holds here.

Dates in the Due column are **absolute** (`Aug 14`), not relative. A register prints dates; distances belong to the Due tab, where the question is "how soon", not "which one".

## Sorting

**Every column sorts.** ADR-0012 named three sorts — creation order, due date, updated — but a table with seven headers of which four do nothing when clicked cannot tell the user which is which without inventing a second header style. Adding the missing sorts is cheaper than teaching that distinction, so Summary, Parent, Assignee and Status sort too.

Three of them need a defined order rather than a natural one: **Status sorts down the ladder** — Open, In Progress, Completed, Closed — never alphabetically. **Unassigned sorts last**, not under "U". **Top-level items sort last** on the Parent column, as undated items already do on the Due column. The sort direction toggles on a second click of the same header, and undated rows stay last in *both* directions, per ADR-0012.

## The filter bar

Six controls above the table — type, status, assignee, parent, due date, labels — each one a dropdown whose **label carries its own state**: `Type: Task, Subtask`, and the control lights up when it is doing something. There is no chip row, because a chip row would print the same thing the controls already say.

The controls **apply live**, one navigation per value; the keyword box **waits for Enter**. That is deliberately two rhythms on one bar: a filter value is a single click and a keyword is a dozen keystrokes, and searching per keystroke means a query and a history entry each time. Every part of the query lives in the URL, so a search is shareable and the back button walks it backwards.

The parent control is a **typeahead** over a flat list of candidates, the same picker ADR-0016 builds for reparenting, with each candidate showing its own lineage so two "Kitchen"s can be told apart. The due-date control is **one radio of six**, and the two that need dates (Before/After, Between) grow their inputs beneath the chosen option rather than reserving space for inputs that are usually irrelevant.

`Parent: House` + `Type: Subtask` is permanently empty — parent means one rung, so a Topic's children are Projects — and the empty state stays **generic** rather than naming the contradiction or preventing it. Explaining the ladder in an error message teaches at the worst moment, and narrowing the Type control to match the chosen parent would make one control silently rewrite another.

## The compact layout

Below ADR-0017's breakpoint the table becomes **stacked rows**: parent and due date on the first line, summary on the second, status and assignee on the third, and **`#id` in the bottom-right corner** — the one stable marker of order, since a phone shows neither headers nor most of the sorted-by columns.

Filters move behind a **Filters button that lights up when any filter is on** — bold, in the primary colour — with **no count and no list of names**. A count has to choose between counting dimensions and counting values, and neither number tells you anything you cannot get by opening the sheet.

The sheet **batches behind Apply**: on a phone the results are hidden behind it, so filtering live would update a list nobody can see. **Sort sits at the top of the sheet**, above the filters — it is one choice out of seven rather than a set of narrowing decisions, and it belongs where it is found first.

## Consequences

**Search is the one tab that breaks the shell.** ADR-0017's split holds everywhere else; here the tab takes the window and the detail view replaces the table. The navigation shell must therefore let a tab opt out of the split, and *Back to results* must return to the query intact — which it does, because the query is the URL.

**#9's "three sorts" is superseded.** Every column sorts, and the three named orders (creation, due, updated) are now three of seven.

**The table is horizontally finite.** Seven columns is what a laptop holds; the design cannot absorb an eighth without either dropping one or introducing horizontal scroll, and v2's configurable additional fields will have to answer that question rather than assume a spare column exists.
