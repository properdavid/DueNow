# Status acts outside the Status Chip

The Status Chip on a work item's own Detail View (ADR-0019) is not the only place status changes. Two other surfaces write it — the **Children Checklist**'s Status Mark and the **Creation Dialog**'s Status field — and each reaches a cascade the surface itself cannot show. This decides what both may do.

## The Children Checklist toggle

**The toggle is a full-power settle, gated by the same Settle Confirmation.** Ticking a child runs the Settle Cascade over that child's whole unfinished subtree, and where there is something to sweep the Settle Confirmation opens under *that row*, naming every descendant, exactly as it does under the Status Chip.

This looks like it contradicts ADR-0018, which kept Complete and Close out of the Work Items Tree. It does not: that objection was never that settling is dangerous but that settling *invisibly* is, and the Settle Confirmation is the answer already built for it. The alternatives both cost more than they saved. Making the checklist marks read-only leaves a checklist you must leave in order to tick, which is most of what a checklist is for. Allowing the tap only when the child has no unfinished descendants puts two different meanings on one gesture, chosen by data the user cannot see.

**The toggle reaches Completed only.** Its whole value is being one tap with no picker — that is what makes ticking three Subtasks feel like a checklist rather than three trips through a menu. Closed is a peer of Completed, not a lesser one, but it is not an equally common act: recording that something will not be achieved is a considered judgement and belongs on that item's own Status Chip. The accepted cost is that closing a child takes a navigation.

**Un-ticking lands on Open, from either terminal status.** The gesture is settle / un-settle — settling always means Completed, un-settling always means Open, and a revealed Closed child answers the same tap. In Progress was rejected because it is a claim about activity that a one-tap correction does not carry, and because it would fire the Start Cascade up the ancestors, turning a mis-tap into an ungated rewrite of every Open ancestor. Restoring the previous status was rejected because it needs a stored `previousStatus`, and ADR-0007 records state, not history.

Two things follow. Un-ticking a child while the item being viewed is itself terminal breaks the Terminal Subtree Invariant and so hits ADR-0003's existing prompt — the child still lands Open while the reopened ancestors land In Progress, which is ADR-0003's one-way rule rather than a new inconsistency. And un-settling is not a cascade: the child's own terminal descendants stay terminal, so an Open Task over three Completed Subtasks is a legal shape.

## The Creation Dialog's Status

**Creating an item as In Progress fires the Start Cascade, announced inline and ungated.** ADR-0016 already ruled this for reparenting — landing an In Progress item under an Open parent fires the cascade, because the move would otherwise silently manufacture the state the cascade exists to prevent — and creation is the same case one rung further back. The Status select carries the announcement the Status Chip's picker carries, naming the ancestors that will move. Without it the dialog's visible effect is one new row while its actual effect is up to four status writes.

**All four statuses are offered.** A new work item has no descendants, so creating one terminal is the single settle that can never fan out: no Settle Cascade, no Settle Confirmation, ever. Back-filling a breakdown where two of six Tasks are already done is real, and the usual objection to settling is structurally absent rather than merely outweighed.

**A pre-filled dialog never inherits the parent's status.** The tree's `⋯ → Add child` and the checklist's inline *Add <rung>* pre-fill type and parent only; Status always defaults to Open. Inheritance would be a third form of propagation, travelling downward — the direction in which ADR-0003 makes the Settle Cascade the only traveller — and would make the same act produce different results depending on which control opened the dialog. Breaking down work in flight therefore adds Open children under an In Progress parent, which is correct: the parent is underway, the new Subtask is not.

## Terminal parents in both pickers

**The Parent select shows terminal parents, carrying their Status Mark**, matching the reparent picker ADR-0016 specified. The list is already filtered by rung, so filtering on status as well would make a Project the user can see in the tree simply absent, with no way to tell which filter removed it — and two near-identical pickers disagreeing about the same set costs more to remember than either rule alone.

**ADR-0003's terminal-parent prompt resolves inline, before submit, as a Reopen Notice.** Choosing a terminal parent grows a notice under the Parent field naming exactly what will reopen, and **Create** then performs both writes; the escape is choosing a different parent, one control away. The picker's GET (ADR-0022) returns each candidate's reopen chain alongside its status, so the notice needs no round trip. A submit-time confirmation would stack a modal over a modal, which is worse in the Compact Layout, and silence is not an option because reopening a Completed Project changes what the tree asserts. The same Reopen Notice appears in the reparent picker for the same case.

The asymmetry with the Settle Confirmation is principled: settling is one tap that fans out over items you cannot see, so it is gated; this is a multi-field dialog where the notice stays visible while you type the Summary, and the parent was chosen deliberately.
