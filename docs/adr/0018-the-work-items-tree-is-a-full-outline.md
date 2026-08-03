# The Work Items tree is a full outline with global creation

The Work Items tab draws the whole ladder as one indented outline. Every rung is a row of the same list — Topic, Project, Task, Subtask — indentation carries parentage, and a chevron on each row with children expands and collapses it.

Two alternatives were built and lost. A **drill-down** tree, where nothing is indented and you stand inside one work item looking at a flat list of its children, buys the phone its full width for summaries and makes creation trivially contextual — the parent is the screen you are on. It loses the thing the tab is for: you can never see a Topic's shape, only one rung of it, and reading two Projects against each other means leaving and re-entering. A **sectioned checklist**, where Topics become sticky sections and Projects become group headers so only Tasks and Subtasks are rows, reads beautifully and captures work fastest, but it flattens the top two rungs into chrome — a Project stops being a work item you can hold and becomes a heading — and it has nowhere to put a Topic's own fields.

**The tree opens fully collapsed**, showing only Topics, and expansion is session-only: leave the tab and it resets. Remembering the last shape was rejected for v1 because two people will want different defaults and the setting to express that is a v2 concern; resetting to one known shape is at least the same shape for both of them. Collapse-all and expand-all are the only bulk controls.

## Type marks and status marks

**Type owns shape and hue; status owns the circle and the blue.** A Topic is an amber star, a Project a violet diamond, a Task a green square, a Subtask a teal triangle. Status is a circle family: an empty grey ring is Open, a half-filled blue circle is In Progress, a blue check is Completed, a filled grey circle is Closed. No type mark is ever a circle and no type mark is ever blue, so the two axes cannot be confused at a glance or at 13 pixels.

Both marks pair shape with hue rather than relying on hue alone, so the ladder and the four statuses survive a colourblind reader. Completed is a check rather than a fuller circle for the same reason: a solid blue disc beside a half-blue disc distinguishes the least actionable row from the most active one by shade alone, and when the disc was muted to quiet it down it collided with Closed's grey. Shape settles both.

## Rows

**Every type renders the same fields.** A Topic shows its status and assignee like anything else, even though a Topic is In Progress for most of its life — a Topic's assignee is an over-arching owner, distinct from whoever holds the work beneath it, and suppressing fields per type in the view would be the first step toward per-type fields in the model, which ADR-0006 refused.

The split layout gives a row one line: type mark, summary, a done-count chip when collapsed, status mark, assignee, due date. **The compact layout stacks rather than sheds** — the summary takes the full width of its indent on the first line, and a second line carries the status mark, the assignee and the due date at small size, printing only what the item actually has. Unassigned renders as the dashed avatar rather than the word, keeping it a first-class state without spending a line on it.

**Terminal items are hidden per parent, not globally.** Each sibling group ends in a "*n* settled — show" line that reveals that group's Completed and Closed items in place, dimmed and struck through; the reveal is per-parent and resets with the session. A single global toggle was rejected: it either floods every group at once or hides the history of the group you are standing in.

**A settled item is never overdue.** Overdue is defined as unfinished and past, so a Completed item with a date behind it renders that date in the normal tone.

## Creating and moving

Creation has one dialog, opened either from the shell's global control or from a row's `⋯` menu, which pre-fills it. **The dialog leads with type** — a four-way segmented control — then Summary, then a Parent select filtered to the one rung that can hold that type, then Description, Due date, Status, Assignee and Labels. **Type, Summary and Parent are required; every other core field is optional and available.** Summary being the only *required* field never meant it should be the only field *offered*.

Creating a Task when its Project does not exist yet costs two passes through the dialog. That is accepted as the honest price of a strict ladder rather than papered over with a create-the-parent-inline affordance, which would manufacture junk Projects to park Tasks in.

The row `⋯` menu carries **Add child**, **Move…** and **Start**, and earns its width on the first of those alone: "Add Task" on a Project fixes both the type and the parent that the cold dialog would ask for. **Complete and Close are deliberately absent from the tree.** Settling an item runs the cascade in ADR-0003 across its whole unfinished subtree, and the tree is exactly the surface where those descendants may be collapsed out of sight — one tap on a collapsed Topic would settle nine items invisibly. Starting an item only walks In Progress up its Open ancestors, which is additive and visible, so Start stays. Settling is a detail-view act, for the same reason ADR-0012 keeps mutation out of Search.

Reparenting keeps the parent picker ADR-0016 specified, reachable both from the detail view and from the row menu.

## Consequences

**Labels lose their colours.** `--label-1..8` is dropped from the token set and the Label Palette leaves Settings: a label is a name only. Labels are filter vocabulary rather than identity, so they are displayed **only on the work item detail view** and offered in the Search filter bar — not on tree rows, not on Search rows, not on Due rows. This amends ADR-0014 and the label half of the Settings decision.

**A type palette replaces it.** Four type colours enter the token set — amber, violet, green, teal — and four status colours narrow to two greys and one blue. The near-neutral chrome that ADR-0014 chose is now carrying two icon axes rather than eight label colours, which is a smaller and more fixed vocabulary than the one it was designed around.

The type-first dialog **amends ADR-0017**, which said the parent picker decides the type and an empty parent means a Topic. Type is now chosen first and the parent list is filtered by it, so a Topic is a type you pick rather than a parent you omit. The single-entry-point rule survives intact — one dialog still reaches every rung.

The compact tree spends 14 pixels of indent per rung plus roughly 28 pixels on the row menu, so a Subtask summary on a 390-point phone has about 250 pixels. Long summaries truncate, and the second line carries no summary text — which makes Summary length a real editorial constraint rather than a theoretical one.
