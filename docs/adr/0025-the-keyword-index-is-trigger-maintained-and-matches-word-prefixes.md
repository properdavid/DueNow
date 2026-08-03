# The keyword index is trigger-maintained and matches word prefixes

ADR-0013 settled that the Keyword box is an FTS5 index over Summary and Description. Three mechanics were left open: how the index stays in step with `work_items`, how a typed word is turned into a match, and what the box does with FTS5's own query syntax. All three resolve toward the same principle — the index is invisible bookkeeping, and the box takes words.

## The index is kept in step by SQLite triggers

The FTS5 table is **external-content** (`content='work_items'`), so no text is duplicated, and it is maintained by three triggers — insert, update, delete — written as raw SQL in a migration rather than by application code inside the transaction.

This is ADR-0010's argument one table over. A missed index write does not throw: it produces a work item that is silently unfindable by keyword, discovered only by someone hunting for a description they cannot quite recall — quiet corruption from a plausible-but-wrong write, which is exactly the failure profile that earned the redundant `parentType` column. Triggers cover every write path without any of them having to remember: the app, the dev-only seed script of ADR-0024, a future v2 clone or template bulk write, and a hand-run `UPDATE` at one in the morning.

Unlike `parentType`, the index is **fully derived**, so a trigger can never disagree with the application about intent — there is no judgement in it to duplicate. External content also makes ADR-0013's "rebuildable at any time" true for free: a rebuild is one `INSERT INTO work_items_fts(work_items_fts) VALUES('rebuild')`, with nothing to reconcile.

This does bend ADR-0011's line that the database stores the tree and does not interpret it. The distinction held is that a trigger here is mechanical bookkeeping, not domain semantics: what a *match means* stays in the query layer, the cascades and the covering rule stay in `tree.ts`, and no rule about work items becomes readable only by reading SQL.

## Matching is `unicode61`, word-prefix, no stemming

The tokenizer is **`unicode61` with `remove_diacritics 2`**, with a `prefix='2 3'` index, and the application appends `*` to **every** token of the query. So `patio quo` finds "Get patio cover quotes", and the rule is one sentence: *every word you type is the start of a word in the work item.*

Stemming (`porter`) was rejected. It buys the irregular cases a prefix cannot reach, and costs explicability: it maps *organization* to *organ*, and ADR-0013 deliberately ships **no snippets**, so a household member receiving a hit they cannot account for has no way to work out why. Prefix matching absorbs most of what stemming would give — plurals, `-ing`, `-ed` are suffixes on a prefix that still matches — with no hits that cannot be explained by looking at the row.

Prefix on the **last token only** is the type-ahead convention, but ADR-0021 made the Keyword box wait for Enter; it is a committed query, not a type-ahead, so treating the first word differently from the last would be an asymmetry with nothing on screen to justify it. `trigram` was rejected outright: a much larger index, a three-character floor, and `art` would match "Bartlett".

The accepted loss is that prefix is not stemming — `quote` will not find "quoting", because nothing after `quot` matches. Retyping shorter is a two-second recovery; an unexplained hit is a puzzle with no exit.

## FTS5's query syntax is not reachable

The box takes literal words. Input is tokenised by the application, everything that is not a word character is dropped, each token is double-quoted and suffixed with `*`, and the tokens are ANDed. `patio "cover` searches for *patio* and *cover*. `Sam OR Alex` searches for all three words, including the literal word "or". `clean-up` searches for *clean* and *up*, and never for *clean* NOT *up*.

Exposing the syntax would be a query builder smuggled back in through the one control with no affordance to teach it, on a tab where ADR-0012 already refused one — and its most likely user is someone who typed an apostrophe. An `OR` inside the Keyword box would also be the only OR-across-anything in a model built on OR-within and AND-across, composing with nothing else on the Filter Bar.

The cost is that an ordered phrase cannot be asked for: `"patio cover"` is *patio* AND *cover* anywhere in the item. At household corpus size those return nearly the same rows.

## The index has exactly one consumer

The Parent Picker — the typeahead built once for the Filter Bar's parent control, for reparenting (ADR-0016) and for the Creation Dialog — does **not** use the index. It is a plain `LIKE '%…%'` over Summary. It filters as you type, so the word-prefix rule is wrong for it (typing `atio` while hunting "Replace Patio Cover" must narrow, and FTS would return nothing); it matches Summary alone, because a parent is chosen by name; and its candidates are already confined to one rung, so a substring scan over a few hundred rows is instant and needs no index.

## Consequences

**The Keyword box can never produce an error.** Empty results, yes; a failed query, no. Nothing a household member can type is a syntax error, so Search has no error state to design.

**Three triggers live in a migration and are not visible from TypeScript.** The seam that proves them is the one the spec already names: that the index stays in step across insert, update and delete of a Summary or Description, and that a rebuild from `work_items` reproduces it.
