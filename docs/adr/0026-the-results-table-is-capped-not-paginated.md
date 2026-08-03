# The Results Table is capped, not paginated

The Search tab opens on the whole corpus (ADR-0012), sorts every column server-side (ADR-0021), and filters in the loader with the query in the URL (ADR-0022). Nothing bounded it. The loader now takes a **`LIMIT 200`**, and the table prints a **Result Count** above itself — `2,412 work items`, or, when the cap bites, `Showing 200 of 2,412 — narrow your search to see the rest.`

At two people creating on the order of ten work items a week, the corpus reaches a few thousand rows after several years: roughly 17,000 DOM nodes and half a megabyte of server-rendered HTML, on a phone, on cellular, every time the tab is opened. Not fatal — which is the problem. It degrades slowly, with no signal, and the first symptom is "Search feels slow" years after anyone would connect it to this decision.

The cap applies **after** the sort, so it is never an arbitrary slice: sorted by Due it is the 200 soonest, by `#` the 200 oldest, and changing the sort changes which 200 you see. And because the notice states the true total, ADR-0012's honest whole survives — the corpus is never quietly reduced, only visibly truncated with its real size named.

## Considered options

**Pagination or Load more** needs a page number, which ADR-0022 requires to live in the URL, and that makes a shared search ambiguous — page 3 of a query whose corpus has since grown is a different set of rows. It also invites the household to page through results rather than narrow them, which is the wrong instinct on a tab built entirely out of narrowing controls.

**Virtualization** breaks find-in-page and complicates the server render, buying a scroll experience for a table nobody scrolls two thousand rows of, and adds a client-side dependency to solve a problem that appears at three thousand rows.

**Doing nothing** is defensible today and gets worse forever.

## Consequences

The Result Count shows **always**, capped or not — it is the one number that says whether a filter did anything. This does not contradict ADR-0021's ruling that the Filters button carries no count: that is a count of *filters*, where the choice between counting dimensions and counting values makes the number meaningless. A count of results has no such ambiguity.

The cap needs a second query — a `COUNT(*)` over the same filtered set — since the truncated page cannot report the total it was cut from.

The cap is a property of the Results Table alone. The Due tab is bounded by its Horizon and the Work Items tree by expansion, so neither needs one.
