# The Due tab is a card list read at a glance

The Due tab renders each work item as a **card**, not a table row: a breadcrumb line on top, the summary at reading size, and a meta line carrying the date, the status mark and the assignee — inside a bordered box with a coloured **urgency edge** down its left side. The three groups are headed with a count, and an empty group is a dashed placeholder saying what would be there.

The tab is the app's landing screen and its job is answering "what is coming up" in one look, from a phone, probably standing up. That is a glancing act, not a reading one, so the surface optimises for the shape of the day being legible before any word is read — and pays for it in density, fitting roughly five rows to a phone screen where a table fits twelve.

Two denser alternatives were built and lost. A **ledger** — a dense register with the breadcrumb running inline before the summary, absolute dates in one right-aligned tabular column, and no status mark — is the most efficient of the three and the easiest to scan for a date, but the inline breadcrumb eats the summary's width at 390 points, and the summary is the thing actually being read. An **agenda** — one chronological rail where dates leave the rows entirely and become day headings, with overdue collapsed into a red "Late" stretch at the top of each group — is the most honest expression of a deadline radar and the only one where a date is never printed twice, but the day headings interleave with the group headings, which puts two competing time structures on one screen.

## What a card carries

Breadcrumb, summary, due date, status mark, assignee. Labels are absent, as ADR-0018 requires.

**The date is spoken relatively first** — "Tomorrow", "in 3 days", "7 weeks late" — with the absolute date beside it in a quieter tone. The relative form is the question being asked; the absolute form is what you need the moment you are deciding whether to move something. Neither is redundant, and both fit on one line. The form does not change per group.

**Overdue is carried three ways at once** — a red edge, red text, and a count of days in words. Colour alone fails a colourblind reader and a glancing one equally, and "how late" is the thing that decides whether a missed deadline still matters. Lateness rounds as it grows: days up to a fortnight, then weeks, then months.

**A card prints its status mark**, even though everything on the tab is unfinished by definition. Open and In Progress is the difference between "nobody has touched this" and "someone is already on it", which is often the only thing separating two otherwise identical cards. Only two of the four marks can ever appear here.

The breadcrumb is the full lineage when there is room and the **nearest two ancestors** in the compact layout, because the nearest ancestor is the one that disambiguates. A dated Topic has no breadcrumb at all and says its type instead.

## The urgency edge

A four-step ramp down the card's left side: **red** overdue, **amber** due today, **faint indigo** inside the next seven days, **grey** beyond. It is the only thing on the tab readable at arm's length, and it is deliberately redundant with the group headings rather than carrying information they do not.

Amber is spent on **today** rather than on the whole of Due Soon. Today is the last day something can still be saved; the rest of the week is not urgent in the same sense, and folding them together would leave the one actionable day looking like the six that follow it.

## The filter

The mine-and-unassigned toggle is a **full-width bar directly under the header**, reading "Showing your work and unassigned" with "Show everyone" as its action — a sentence rather than a control, because a two-state filter with no legend has to say what it is currently doing, not just offer the switch. It is the tab's only control, per ADR-0009.

## Consequences

**Due Later is a long scroll on a phone.** Five cards a screen against a thirty-day horizon means the least actionable group takes the most scrolling. Collapsing it behind a count or giving it thinner rows was considered and declined for v1: it would put two card treatments on one surface to solve a problem that only appears once the household has a lot of dated work, and the horizon can be shortened more cheaply than the layout can be split.

**The horizon is forward-only.** Something forty-seven days late still appears in Due Now, because reading "within thirty days" symmetrically would make a badly-overdue item vanish precisely as it got worse. The tab is therefore unbounded backwards, and a household that abandons work will accumulate rows it has to settle rather than outrun.

**Nothing on the tab mutates.** Tapping a card opens the detail view — a full-screen push in compact, the right column in split, per ADR-0017 — and settling stays there, on ADR-0019's reasoning.
