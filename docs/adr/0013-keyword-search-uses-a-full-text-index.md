# Keyword search is a full-text index over summary and description

The Search tab's keyword box matches against a work item's **summary and description**, treats a multi-word query as an AND of its terms in any order, and is backed by a SQLite FTS5 index rather than a `LIKE` scan.

Searching the summary alone is the cheapest option and gives every hit an obvious explanation — the work item is called that. It also fails the case the box exists for: half-remembering something written in a description whose summary you cannot recall. Descriptions are markdown that people actually write into, so the detail lives there and the index has to reach it.

Comments are excluded. They are the largest volume of text and the most conversational — in a two-person household, largely coordination chatter — so including them trades a lot of noise for a thin slice of recall. A comment match is also a hit on a child record, which means the row shown is a rung removed from the thing that matched.

Multi-word queries AND their terms rather than matching a literal substring. A substring match is one line of SQL and perfectly adequate for a few hundred rows, but it punishes the most natural way to search: typing `patio quotes` finds nothing when the text reads "patio cover quotes". Tokenised matching makes a second word narrow the results instead of breaking them.

## Consequences

FTS5 means a **second table** kept in step with `work_items` on every insert, update, and delete of a summary or description. This is an addition to the schema settled by ADR-0010, which anticipated only the work item table and its labels and comments. The index is derived state and rebuildable from `work_items` at any time, so it is a cache, not a source of truth, and a migration may drop and repopulate it freely.

**Matches are not explained.** A row shows the summary, so a work item that matched on a word buried in its description looks arbitrary until opened. Snippets with the matched term highlighted would fix that, and were deliberately left out — they turn a list of work items into a list of excerpts, and at household corpus size the unexplained hit is a small enough puzzle to accept.

The keyword box is a filter dimension like any other: it ANDs with the rest of the filter bar and rides in the URL with them.
