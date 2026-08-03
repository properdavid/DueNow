# Reparenting moves a subtree within its rung

A work item can be reparented at any time, but only onto a parent of the type the ladder already requires — a Task moves to another Project, never onto a Topic. The type of the moved item, and of everything beneath it, never changes. Promotion and demotion, which ADR-0010 left as expensive-but-possible, are not in v1.

Reparenting is a general capability rather than the escape hatch ADR-0003 needs when an operation would leave a terminal parent holding unfinished descendants. Restricting it to that prompt would have been more code, not less: the prompt already requires a picker of valid targets, ladder validation, and the write, so confining that machinery to a modal buys nothing. The alternative correction — delete and recreate in the right place — is not equivalent either. It discards comments, `createdAt` and `createdBy`, which ADR-0007 makes the record, and ADR-0010's `RESTRICT` on parentage means an item with descendants may not be deletable at all. Misfiling is the expected error in a four-rung tree, not an exception.

Three properties are forced rather than chosen. A move always carries the subtree, because a Subtask's only legal parent is a Task and leaving children behind would orphan them. A move can never land inside its own subtree, because the target rung is fixed, so there is no cycle check. And a Topic cannot move, because it has no parent.

Status reacts at the destination and not at the source. Moving an In Progress item under an Open parent fires ADR-0003's Start Cascade up the destination's ancestors, because otherwise the move silently manufactures the one state that cascade exists to prevent — an Open ancestor containing In Progress work — without anyone having touched a status. The source parent does not demote when it loses its last In Progress child: ADR-0003 already establishes that propagation is one-way and that a parent never demotes when its children do, and a child leaving is a weaker signal than a child going terminal. Demoting would redefine In Progress from "someone started this" to "something beneath this is live", which is a different field.

The move is made from a parent picker opened from the work item detail view or from the Work Items tree row menu, and there is no drag in the Work Items tree. The picker has to exist for ADR-0003's prompt regardless, so drag would be a second mechanism for one verb. Drag is also weakest on the device class the household uses most — ADR-0014 raised control minimums under a coarse pointer because a miss-tap is costly, and a miss-drag refiles work silently — and it requires both the source and the target to be expanded at once in a four-rung tree, which a picker does not. ADR-0006 defers manual sibling ordering to v2, so a drop between two siblings would have to mean nothing; drag can pick up reparenting when reordering arrives.

The picker lists only valid parents, each shown with its Topic because Project names alone will not disambiguate, and excludes the current parent. Terminal parents are listed rather than hidden, and choosing one raises ADR-0003's prompt — hiding them would make a legal but consequential move look impossible.

## Consequences

Reparenting is a single-row write: `parentId` and `parentType` on the moved item, plus whatever the Start Cascade touches at the destination. No descendant row changes, because the adjacency list of ADR-0010 stores parentage only on the child.

An item whose scope was misjudged has no in-app correction in v1. A Task that has grown into a Project stays a Task until promotion arrives, and the workaround — recreate and refile the children — is deliberately unattractive rather than smoothed over.

Whether a move is visible after the fact depends on the history surface ADR-0007 defers to v2. In v1 it leaves only `updatedAt` and `updatedBy` on the moved item.
