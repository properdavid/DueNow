# One core field set for every work item type

Every work item carries the same core fields — summary, description, assignee, status, due date, labels, comments — regardless of whether it is a Topic, a Project, a Task, or a Subtask. No field is withheld from a type and no field is required for one type but not another. The only structural difference between the rungs is that a Topic has no parent.

The obvious alternative is to tailor the set per type: no due date on a Topic, no labels on a Subtask, an assignee mandatory only on the leaves. We rejected it because the cases that motivate it dissolve on inspection — a Topic named Taxes has a perfectly real due date — while the cost is permanent: a per-type validation matrix, four detail forms, and four shapes for search and the Due tab to reason about. Uniformity also keeps the tailoring in the one place it belongs, as an explicit per-type feature layered on top of a uniform core, rather than baked into the core where it cannot be turned off.

## Consequences

Which types appear where becomes a read-side question that each surface answers for itself, by filtering on type. The Due tab may choose to ignore Topics; the schema does not decide that for it, and changing that choice touches one query rather than the model.

The uniform set includes fields many items will never use, so emptiness is normal and every surface must render an item with no assignee, no due date, and no labels as an ordinary case rather than an incomplete one.
