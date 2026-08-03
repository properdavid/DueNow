# The work item detail view is one editable document

The detail view is a single scrolling document, not a form and not a record with a property panel. Top to bottom: a breadcrumb of ancestors and the item's type, the Summary as a heading, a wrapping strip of **property chips**, the Description as prose, the children, and the comments last. It is **one view for all four types** — a Topic gets the same layout, the same chips and the same comment section as a Subtask, and differs only in what its fields happen to hold and in what its child rung is called. This is ADR-0006 held to in the UI: withholding a chip from a Topic because a Topic rarely has a due date would be the first step toward per-type fields.

Two alternatives were built and lost. A **Record** — labelled fields in their own rail, a right-hand column on desktop and a sheet on a phone, with nothing committing until Save, and the body split into Description / children / Comments tabs — is the safest of the three and the only one where a phone never scrolls past three surfaces to reach the third. It lost because the tabs hide the two things you most often want side by side: what the item says and what is left underneath it. A **Workbench** — a full-width Start/Complete bar directly under the summary, children as the body, fields demoted to a disclosure, and comments as a chat thread with a pinned composer — is the fastest view to act in and the best-feeling on a phone, but it optimises for a household that mostly acknowledges work rather than describes it, and it buries the fields that ADR-0006 insists every item carries.

## Editing

**A field's value is its control.** Status, Assignee, Due date and Labels are chips; tapping one opens a small popover and the choice commits immediately. There is no edit mode, no Save button, and no dirty state to reason about.

**Free text is the exception, and commits explicitly.** Summary, Description and Comments each turn into a text area with a small ✓ and ✕ beneath it. The check commits, the cross discards, and **blur commits nothing** — a half-written sentence must never be able to save itself because a tap landed elsewhere. Escape discards from any of the three; Enter confirms a Summary (Shift+Enter for a newline) but not a Description or a Comment, both of which need Enter for their own newlines.

The distinction is composition, not risk: a picker offers a closed set and one tap replaces another, while free text is written over several seconds and is worth exactly nothing halfway through. **An empty Summary cannot be confirmed** — the ✓ disables and ✕ is the way out — because Summary is the one field ADR-0006 made mandatory, and reverting silently would leave the person unsure which of the two texts survived.

## Children

Children are a checklist in the document, not a panel: status mark, summary, due date, assignee. The status mark is a toggle — it completes and un-completes that child directly. Each group ends in the same per-parent "*n* settled — show" reveal the tree uses (ADR-0018) and an inline "Add <child rung>", which opens the creation dialog with type and parent pre-filled.

A Subtask has no children and shows no children section at all — the one place the four types genuinely diverge, and only because the ladder ends.

## Comments

Comments are the last section of the document rather than a tab or a pinned thread, so reading an item ends in the conversation about it. Each comment carries its author, its relative time, and — **on your own comments only** — Edit and Delete.

Those controls are **always visible rather than revealed on hover**, because half the devices this runs on have no hover. Editing reuses the same ✓ / ✕ text editor. An edited comment is marked **`· edited` and nothing more**: no edit timestamp and no revision list, because ADR-0007 records state rather than history and a second timestamp per comment is where an activity feed starts. Delete is hard, as #5 decided, so it asks **Delete? Yes / No** inline in the same meta line — a modal for a two-person household's own comment is heavier than the act.

## Cascades

**Settling confirms before it acts, in a popover under the status chip.** Choosing Completed or Closed when there is unfinished work beneath opens a popover listing every descendant it will sweep, with the count in its heading, and nothing changes until it is confirmed. When there is nothing to sweep it commits straight away — a confirmation with an empty list teaches people to dismiss confirmations.

A modal listing the same items was rejected as heavier than the act; **acting first and offering Undo was rejected outright**. A cascade is a fan-out over work the person cannot currently see, and an Undo that has to be noticed and reached within a few seconds is not consent — it is a race. This is the same reasoning that kept Complete and Close out of the tree in ADR-0018 and out of Search in ADR-0012, and it is why the detail view is where settling happens: it is the one surface that can name the items it is about to change.

The Start Cascade needs no confirmation and gets none, but the status popover names it: when the item is Open and has Open ancestors, a line reads which ancestors starting it will also start. Starting is additive and reversible, so it is announced rather than gated.

## Consequences

**The current user's avatar is inverted.** Yours is a solid indigo disc with a knocked-out initial; your partner's keeps the soft fill. This is the shared avatar atom, so it lands everywhere an avatar appears — tree rows, Due rows, Search rows, comments — not just here. With exactly two members and no other identity colour in the chrome, fill is enough to make your own work and your own words carry more weight on every list, and it costs nothing to a colourblind reader because the initial is doing the identifying either way.

**Labels appear here and only here**, as ADR-0018 required, and the label chip is also where they are added and removed.

The detail view owns the whole pane it sits in, including its own breadcrumb and its back or close control. The shell (ADR-0017) supplies the pane and nothing else: a full-screen push under the tab capsule when compact, the right column of the split when wide. There is no title bar to inherit, so a detail view that did not say where it was would leave a phone with no answer at all.

**Nothing in the detail view renders Markdown.** The Description and comments are plain text areas showing plain text, per #5; a preview toggle or a toolbar is the v2 item already recorded on the map.
