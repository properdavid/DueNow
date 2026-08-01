# Status is stored, and propagation is one-way

Every work item's status is a stored value, changed only by a person or by a cascade acting on their behalf. Nothing about a work item's status is derived from its children. Two cascades exist and nothing else propagates: the **Settle Cascade** carries a terminal status down onto unfinished descendants, and the **Start Cascade** carries In Progress up through Open ancestors.

The obvious alternative is deriving a parent's status from its subtree — a parent is Completed when all its children are, In Progress when any child is. We rejected it because it cannot express the cases the household actually has. A Kitchen Project sits In Progress forever even when every task under it is Completed; a parent stays In Progress when its last active child goes back to Open, because "between active tasks" is not "not started"; and Completed-versus-Closed encodes *why* something ended, a human judgement no child can supply. Derivation would also make the Due tab and search filters depend on a recursive rollup rather than a plain stored value.

The same reasoning makes propagation deliberately asymmetric. Cascades fire only on the two moments that carry real intent — starting work and settling it. Reopening a terminal parent does not reopen its children, un-completing a child does not touch its parent, and a parent never demotes when its children do.

## Consequences

Because status is stored rather than computed, correctness depends on the cascades being applied as a single atomic write across the parent and every affected descendant — a half-applied cascade leaves the tree violating the Terminal Subtree Invariant (a terminal work item never has unfinished descendants). Every status write, cascaded or manual, is attributed to the acting user, so a Subtask reading Closed traces to the person who closed the Project above it rather than to "the system."
