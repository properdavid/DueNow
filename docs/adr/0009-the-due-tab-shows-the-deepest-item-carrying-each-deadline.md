# The Due tab shows the deepest item carrying each deadline

A work item appears on the Due tab if and only if it is unfinished, has a due date within thirty days of Today, and has no unfinished descendant due on or before its own due date. An item excluded by that last condition is **covered** — something beneath it is already carrying the deadline, and that something is the actionable one.

The Due tab is a deadline radar, not a work queue: it answers "what is coming up" rather than "what should I pick up next", so an item without a due date has nothing to be on it for. Undated work is a backlog, and a backlog is a different surface with different sorting, deliberately left to a later effort.

ADR-0006 gave every type the same field set, so a Topic, Project, Task, or Subtask may each carry a due date, and the tab had to decide which of them surface. Showing every dated item put a Project, its Task, and its Subtask on screen as three peer rows for one concern. Showing only leaves — items with no unfinished children — read better, but broke on a Project with a hard external deadline: giving it Tasks stopped it being a leaf, so its date went dark precisely because someone had done some planning. The covering rule keeps both properties. A dated ancestor is quiet exactly while something sooner beneath it speaks for it, and it reappears the moment nothing does — when its children are undated, when they are all due later, or when they have all reached a terminal status.

The rule needs no recursion. A covering descendant that is itself covered is covered by one due at least as soon, so a single "does any unfinished descendant beat my date" check is equivalent to walking the chain.

The three buckets are Due Now — due today or overdue — then Due Soon for the next seven days, and Due Later for the twenty-three after that. They roll from Today rather than aligning to calendar weeks or months, which would make Due Soon nearly empty each Sunday and refill it each Monday; a rolling window means the tab means the same thing whenever it is opened. Overdue items sit at the top of Due Now, marked with how late they are, rather than in a fourth bucket that is empty most of the time and becomes a graveyard once it is not. Thirty days is a horizon, not a filter: without one the tab degrades into every dated item sorted by date, and the buckets stop drawing a distinction.

The tab defaults to showing work items assigned to the signed-in member plus unassigned ones, with a toggle to widen to everyone. The toggle does not persist; every visit opens narrowed.

## Consequences

Covering is computed over the **visible** set, not the whole tree. A descendant filtered out by the assignee toggle cannot cover its ancestor — otherwise the filter and the covering rule combine to hide a deadline that neither hides alone, which is the one failure a radar cannot afford. The visible consequence is that widening the filter can replace a row with a deeper one rather than only adding rows.

Both rules are pure functions of stored state — status, due date, parent, assignee, and the household timezone of ADR-0008 — so the tab derives entirely from a query and stores nothing of its own. There is no computed "effective due date" on a work item, and no denormalised bucket column to keep in step with edits.

Because the default filter is narrowed, neither member sees the other's overdue work without deliberately widening. That is a knowing trade of shared accountability for a shorter list, and it is reversible in one tap rather than in a settings screen.

The tab carries no controls beyond that one toggle — no sort, no grouping, no show-completed. Slicing work items along other axes is the Search tab's job, and duplicating it here would make the Due tab a worse Search while diluting what it is for.
