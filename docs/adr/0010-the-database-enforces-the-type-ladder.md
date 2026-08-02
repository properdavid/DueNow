# The database enforces the type ladder

All four types live in one `work_items` table as a plain adjacency list, and the ladder of ADR-0002 is enforced by the schema itself rather than by application code alone. A row carries its own `type` and, redundantly, its `parentType`; a `UNIQUE (id, type)` key lets the parentage foreign key be composite, `FOREIGN KEY (parentId, parentType) REFERENCES work_items(id, type)`; a `CHECK` pins `parentType` to the rung one above `type`, and another makes `parentId IS NULL` true exactly when the type is Topic. A Subtask under a Topic is not a validation failure, it is a row SQLite will not store.

One table follows from ADR-0006 — a uniform field set has nowhere else to go, and cross-type reads like the Due tab and Search would otherwise be a four-way union. Four tables would have made the ladder structural for free, but at the cost of every read.

The application validates first regardless, because reparenting and creation need to offer valid targets and produce good errors. The constraint is a backstop that should never fire; if it does, that is a bug rather than a user mistake, and it surfaces as a failure rather than a message. What it defends against is the write that is wrong but plausible — a reparent that updates `parentId` and forgets `parentType`, or a v2 bulk subtree write from clone or templates. Those are the writes least exercised by hand, and a malformed tree does not throw: it silently produces wrong answers on the Due tab, where the covering rule of ADR-0009 depends on ancestry being real. That failure profile — quiet corruption rather than a loud crash — is what earns the redundant column.

Parentage deletes are `ON DELETE RESTRICT`, so no delete can cascade a subtree away by default; what deletion actually does is left to its own decision. Labels and comments go the other way, `ON DELETE CASCADE`, on purpose: a child work item is a peer with its own life, while a label attachment or a comment is part of the item it hangs on. Deleting a label detaches it everywhere, which is what makes ADR-0006's household-managed label set safe to prune.

## Consequences

`type` and `parentType` are immutable in ordinary editing, so retyping a work item — promoting a Task to a Project when it turns out to be one — is a whole-subtree rewrite in a single transaction, with every descendant shifting a rung and the constraint validating the result. The schema makes that expensive rather than impossible, and whether v1 offers it belongs to the reparenting decision.

There is no `depth` column, no materialised path, and no closure table. The ladder caps depth at four, so the unbounded-tree problems those solve do not exist here, and each would add a denormalised structure to keep in step with every write.

Whole-subtree inserts must order parents before children, which the composite key forces. That is a constraint on v2 clone and templates, and a helpful one.

Dates and instants are stored differently on purpose. A due date is `TEXT` in `YYYY-MM-DD` form, which is exactly what ADR-0005 says it is — a calendar day, no time, no timezone — so it sorts and compares as a string and can never quietly acquire a midnight in the wrong zone. Timestamps are epoch-millisecond integers, because they are instants.
