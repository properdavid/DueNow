# An empty screen is a card that never offers to create

Every surface that can render nothing renders a **centred card**: a mark, a headline, one line of explanation, and — only where there is genuinely something else to do — one secondary link. This covers the sign-in screen, the allowlist rejection, the Work Items tree, the Due tab, and the Split Layout's unselected right column.

The stance is that an empty screen is a moment of doubt — *is it broken, or is there really nothing?* — and the card answers it out loud. That is worth paying for even on the screen the household sees most: a Tuesday morning with nothing due prints **Nothing on the radar / No work is due in the next 30 days.** and stops there.

## Empty is two cards, because it is two states

ADR-0024 established that every surface renders nothing for two unrelated reasons, and that the test is always whether any work item exists — never whether a row is currently visible. Each pair gets its own card.

| surface | First Run | steady state |
| --- | --- | --- |
| Work Items | *Nothing here yet* — "Start with a Topic — a standing area of household life, like House or Travel. Projects, Tasks and Subtasks hang off it." | *All settled* — "Nothing is unfinished. Everything either of you has created has been completed or closed." plus **Show N settled** |
| Due | *Nothing due yet* — "This is where dated work shows up, 30 days ahead. Create your first work item and give it a due date." | *Nothing on the radar* — "No work is due in the next 30 days." |

The all-settled card's **Show N settled** is ADR-0018's per-parent reveal doing its job at the root. Terminal top-level Topics now hide behind the same control every other rung uses, so *all settled* really is zero rows plus a reveal — which is precisely why it looks identical to First Run and means the opposite.

## No empty state offers to create

The card never carries a create button. ADR-0017's creation control — the action button in compact, the sidebar button in split — is already on screen, offering the same verb a few centimetres away, and it is most visibly duplicated on the very first screen a new household ever sees, which is where ADR-0024 put the invitation. The empty state teaches *where creation lives* rather than becoming a second door to it.

The rule is uniform rather than per-surface: the tree's *all settled* card loses the button as well, and the only buttons surviving on any empty state are **Show N settled** and the rejection's **Try another account**.

The copy therefore names the verb and never the location. "New work item is in the corner" is true on a phone and false on a desktop, where the control sits at the top of the sidebar, and one sentence that changes with the layout was rejected over one that does not need to.

## Sign-in, and being turned away

Sign-in is the wordmark over one card — *Your household's work, in one place*, **Continue with Google**, and the footnote "Only accounts set up for this household can sign in."

The rejection is **the same card with the message swapped**, written for a non-technical visitor:

> **You can't sign in here**
> *name@example.com isn't one of the accounts set up for this household. If you have another Google account, try that one — otherwise ask whoever set this up to add you.*
> **Try another account**

No "list", no "instance", no "configuration". ADR-0004's allowlist is a household fact rather than an admin concept, and the visitor cannot act on the vocabulary in any case. The person reading this screen is either the partner signed in to the wrong Google account or a stranger who found the URL, and the first needs to be told what to do about it. The disclosure was accepted knowingly: the screen confirms to a stranger that this is a household DueNow they are not part of, and the closing clause is the only sentence saying a human could let them in.

## The unselected column keeps its card, even beside another one

The Split Layout's right column shows *Nothing selected* — "Pick a work item on the left and it opens here, beside the list" — including at First Run, where the screen consequently prints **two cards at once**. That was the obvious thing to cut and it survived: the right column's card is the only thing on screen that explains what the split is for, so the moment it has nothing to hold is the moment it earns its words.

## Consequences

The alternatives were built and lost. **Bare** — one dim sentence exactly where the first row would have been, no card, no mark, no button, a genuinely blank right column — is calmer, more consistent with ADR-0014's dense professional register, and never repeats a control; it lost because it cannot distinguish a healthy screen from a broken one, and faint grey text at the top of a white pane is what a failed load looks like.

**Working** — a live row-shaped composer for the first Topic, the next dated work past the Horizon named on a clear radar, a standing *Next up* list in the unselected column — lost three ways: the composer is a second creation entry point that ADR-0017 and ADR-0018 spent real effort reducing to one, reachable once in a deployment's lifetime; naming work beyond the thirty-day Horizon quietly un-chooses ADR-0009's horizon by dragging work back onto a screen that had correctly decided it was not urgent; and *Next up* prints the Due tab's own sentence a second time on the same screen.

The tree gains a root-level settled reveal it did not previously have, which is a change to ADR-0018's rendering and not to its rule. Search's empty states are untouched — ADR-0021 owns them, and its two cases (an empty corpus and a query with no hits) are its own.
