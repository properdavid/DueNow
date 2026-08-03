# The wordmark is set type, the app icon is a checklist monogram, and empty cards wear the surface

DueNow's identity is three separate objects, decided together because ADR-0028 and ADR-0029 both lean on them and neither decides them.

**The App Icon** is a checklist with its outer square dropped, because the app tile already draws it: two white ticks stacked down the left, the letters **D** over **N** down the right where the checklist's two horizontal rules were, white on the primary indigo, edge to edge. The artwork is **scaled to 88% about the centre** so that every stroke end and both letterforms clear Android's circular maskable crop — at full bleed the N's outer corner sat at r≈43 on a 100-unit grid against a crop at r=40, and a launcher would have shaved it.

**The Wordmark** is the name set as type and nothing else: **DueNow**, Inter semibold, tracking tightened to `-0.025em`, in the primary indigo. It appears in exactly two places — over the sign-in card, and in the sidebar header of the Split Layout. There is no lockup: the icon and the wordmark are separate objects that never appear together.

**A Surface Mark** is what ADR-0028 meant by "a mark" at the top of an empty card. It is a picture of *the surface*, not of the product — a list for the empty tree, a check for *All settled*, a clock for both Due states, a split pane for the unselected column, a crossed circle for the rejection — drawn as a `lucide-react` outline glyph in a 44px `primary-soft` disc.

## One artwork at every size, favicon included

The icon ships unchanged at 512, 192, maskable, and down to a 16px favicon, where four elements in sixteen pixels visibly become four smudges on an indigo square.

That was looked at directly — the losing variant existed to force it — and accepted. DueNow is a self-hosted app for two people that is installed to a home screen and opened from there, so 16px in a browser tab is the *rarest* size it has, and the tab title sits immediately beside it saying DueNow. A second, simplified piece of artwork would serve the rarest case at the cost of two files that can drift apart and a tab icon that is visibly a different object from the home-screen icon.

The corollary is that the icon is recognised as **the indigo square** rather than read, which is also why the indigo matters more than the drawing does.

## The wordmark stands alone, and the mark stays in the tile

The alternative was giving the mark its own drawn edge — keeping the checklist's rounded square as white stroke *inside* the indigo tile — so that it becomes a portable object: a lockup beside the wordmark, and the head of every empty card.

It lost on its own best property. A mark that can travel does travel: at First Run in the Split Layout it prints **three times on one screen** — sidebar, tree card, unselected column — on the very first screen a household ever sees. The drawn frame is also the first thing to die under the maskable crop and at 32px, because it spends the icon's outermost pixels on a border rather than on the mark.

A third direction dropped the ticks entirely for a bare **DN** monogram. It is legible at every size and says nothing about what the app is for; its job was to prove that the ticks genuinely cost legibility at 16px, which is what makes the paragraph above a decision rather than an oversight.

## Empty cards wear the surface, not the brand

Putting the brand mark on every empty card makes one shape to learn and lets the headline say which screen you are on. Putting a different picture on each card makes the mark itself say which screen came up empty — before the headline is read, and at a glance, which is the register ADR-0020 already chose for the Due tab.

The second wins because the two cards a household actually confuses are *Nothing here yet* and *All settled* (ADR-0024's one-way door), and those two now differ in their mark as well as their words. It also keeps the brand off the screens the household sees most: a clear radar is the healthy steady state, and it should not be the place the app introduces itself.

## Consequences

**The primary indigo now has a second home that no token can reach.** ADR-0014 called primary "a cheap token to retune later" because its surface area is small. That is still true on screen, but the icon artwork and the manifest's `theme_color: "#4d41c8"` are exported files carrying the same value literally, so retuning the primary means re-exporting the icon set. `design-lint` cannot see either.

**The letterforms are outlined in the shipped artwork.** Inter is self-hosted (ADR-0014), and an icon rendered by a launcher has no access to it; the D and N are paths in the exported PNGs and in any SVG favicon, not live type.

**The mark vocabulary gains a fourth member.** Type Mark, Status Mark and Urgency Edge all appear on populated rows; a Surface Mark appears only on an empty card and never beside them, so the collision is one of naming rather than of screen.

**Nothing changes in the Compact Layout.** There is no title bar (ADR-0017), so below 1024px the wordmark appears on the sign-in screen alone and the app icon is whatever the launcher drew. Whether a mark travels was, in the end, a desktop-only question.

Primary source: the [`prototype/identity`](https://github.com/properdavid/DueNow/tree/prototype/identity/prototypes/identity) branch, which carries all three directions and the icon sheet that decided the sizes.
