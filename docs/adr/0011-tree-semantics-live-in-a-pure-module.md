# Tree semantics live in a pure module, not in SQL

The database stores the tree; it does not interpret it. What the tree *means* — the Settle and Start Cascades of ADR-0003, the Terminal Subtree Invariant, the covering rule of ADR-0009, ancestry for breadcrumbs — lives in one pure module that takes plain rows and returns plain results, and never sees a database handle. The domain folder holds two modules rather than one: `work-items.server.ts`, which talks to the database, and `tree.ts`, which is pure.

The alternative was to express ancestry and descent in SQL, either as fixed join chains — legitimate here, since the ladder caps depth at four — or as recursive CTEs. Both were rejected for the same reason: they scatter the invariants. The covering rule would be written once in the Due tab query, the descendant sweep again in the cascade, ancestry again for the detail view, with each expression coupled to storage and none testable without a database. The rules would exist in three places and be authoritative in none.

Keeping them in a pure module makes the tree the deep part of the domain and storage the dumb part, and the two stay orthogonal: the invariants can be rewritten without touching a query, and the schema can change without touching a rule. It is also the difference between tests that need `:memory:` and real migrations and tests that need an array of rows. That splits the inherited convention of one `.server.ts` per domain taking `db` as its first argument, which is a deliberate departure and the only one.

The tree itself is not part of the interface. Callers get verbs and read models — settle, start, reparent, the due radar, a work item with its lineage, the tree view — and never learn the tree's shape. Exposing a loaded tree for callers to walk would look like a smaller interface while leaving the hard part with the caller: three surfaces walking the same structure are three chances to get "covered" subtly wrong, and one shared type coupling every one of them. The pure module is an internal seam with its own tests, invisible from outside.

## Consequences

Reads load what they need rather than sharing a cached tree, so two surfaces on one page may load overlapping rows. At two people and a few thousand rows that costs nothing, and it keeps each verb independently testable and independently changeable.

Cascades compute in memory and write once: the descendant set is derived in the pure module, then applied as a single statement inside a transaction, which is what ADR-0003's "one atomic write" requires. `better-sqlite3` is synchronous and single-process, so there is no interleaving between the read and the write.

Route handlers contain no tree logic. A handler calls a verb and renders; if tree reasoning appears in a route, that is the signal a verb is missing.
