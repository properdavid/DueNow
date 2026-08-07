# The Work Items tree guarantees a summary budget

A tree row's Summary is the thing being read. Every other element on the row annotates it. The tree nonetheless shipped a row whose fixed elements consumed more width than the column had, so at the deepest rung the Summary was allocated a negative budget and a Topic called "Travel" rendered as "Trav".

**The tree guarantees a pixel budget for the Summary, at the deepest rung, at every width the column can take.** The budget is 24 characters of Inter at whatever size the Summary currently renders — 170 pixels at the size in force when this ADR landed.

**The guarantee is stated in pixels because pixels are the only unit the layout can reason about.** The budget is 24 characters of Inter at the Summary's size, measured rather than assumed. Twenty-four characters is roughly four words, which is what it takes to tell two Subtasks of one Project apart; that is the job the Summary does in an outline, and it is the job the guarantee protects. Characters are a claim about legibility and belong here, in prose, with the measurement that connects the two recorded below. A geometry module that converted characters to pixels using an assumed glyph width would be proving its own assumption.

The measurement is an **average** over representative household summaries, so the guarantee is about ordinary text and not about a worst case: 24 unusually wide characters still truncate.

## The measurement

Inter Variable at weight 500, measured on a canvas across nine representative household summaries ("Travel", "Replace the bathroom fan", "Schedule dentist appointment", and similar):

| Size | Average glyph | 24 characters |
| ---- | ------------- | ------------- |
| 16px | 8.05px        | 194px         |
| 14px | 7.04px        | 170px         |
| 12px | 6.04px        | 145px         |

Re-measure this table if the typeface changes or if a typography role that the row uses moves. It is the only input to the guarantee that lives outside the code.

## The row decides its own layout from its own width

ADR-0018 gave the split layout's row one line and the compact layout's row two, keyed off the viewport. That was right about the two shapes and wrong about what selects them: a narrow column on a wide screen is the same problem as a phone, and the viewport cannot see it. The tree's own resize handle could produce exactly that state.

**The row now chooses between one line and two by asking how wide its column is, not how wide the window is.** A container query on the list column selects the stacked shape below a threshold and the one-line shape at or above it. Both shapes are ADR-0018's — the one-line row keeps type mark, summary, done-count chip, status, assignee and due date; the stacked row keeps summary on the first line and status, assignee and due date on a small second line. This amends ADR-0018's account of *when* each shape applies, not what either contains.

The consequence is that the guarantee holds by construction. There is no column width at which the row is wrong, because the shape that cannot fit is never the shape that renders. The threshold and the floor become derived numbers rather than defended ones.

## The derived geometry

The row's fixed cost is measured from the rendered row, not estimated: chevron button 36, type mark 16, status mark 16, avatar 28, row menu 36, three metadata gaps and four row gaps at 8 and 12, the row's own horizontal inset, the tree card's hairline, the indent, and the page wrapper.

Three of those inputs were wrong and are corrected here rather than worked around:

- **Indent is 14 pixels per rung.** ADR-0018 stated 14 and the code spent 24 (`pl-4/10/16/24`), so the deepest rung cost 96 pixels where the written decision implied 58. This is enforcement of an existing decision, not a new one.
- **The due date is formatted, not raw.** The tree printed ISO (`2026-08-10`, 81px at the size it renders) while the Search tab already formatted the same value as `Aug 10` through its own private helper. The formatter moves into a shared module and both surfaces call it. Three surfaces printing dates three ways was the defect; the width saved is a consequence.
- **The date slot is sized to the date.** A `w-20` spacer reserved 80 pixels on rows that have no due date at all. Its replacement reserves the **widest** string the formatter can emit (`May 30`), not a representative one, because a budget defended by a representative value is not a guarantee.

**Every constant here is derived, not chosen.** The module computes the threshold as the one-line row's fixed cost at the deepest rung plus the Summary budget, and the floor as the stacked row's fixed cost plus the same budget. Only the ceiling (768, past which the list starves the detail view) and the default's margin above the threshold (24 pixels, so the default follows the threshold when a type role moves) are chosen. Do not quote the resulting numbers from prose — read them from the module, which is the single place they are correct. At the type sizes in force when this ADR landed they came out at a **525** threshold and a **406** floor.

These constants live in one module with the arithmetic unit-tested, because the failure this ADR exists to prevent is someone adding an element to the row without redoing the sums. The test asserts the pixel budget survives at the floor, at the threshold, and at the deepest rung.

## The splitter

ADR-0017 called the content area "a resizable two-column split". It was resizable in the sense that CSS `resize-x` was set, and not in any sense a person could act on: the native grip is a 16-pixel triangle at the bottom-right corner of a full-height column, flush against the bottom edge of the window, painting nothing at all under macOS overlay scrollbars. The border between the columns — where every split interface trains you to reach — was inert. Driving it with a synthetic mouse confirmed the mechanism worked and the affordance did not.

**A real splitter replaces it**: a full-height target on the shared border, with a visible hover state and arrow-key support. It is safe to build only because the row now handles every width; before that, the handle's whole travel range led into the broken state.

**Its width persists in a cookie, shared by every split route.** The shell loader already runs beneath all of them, so the server renders the correct geometry on the first paint. `localStorage` was rejected for a specific reason rather than a general one: the container query means the width decides the *row's shape*, so a post-hydration correction would not merely resize a column, it would visibly restack every row. One width rather than one per route because the split is a property of the shell, not of a destination — every split route is the same list-beside-document arrangement.

At the time of writing that means `/due` and `/items`. `/search` renders full-width (`handle = { layout: "full" }`, ADR-0021) and so has no list column to size, but it inherits the cookie for free if it ever gains one.

ADR-0018 declined to remember tree expansion, reasoning that two people will want different defaults and the setting to express that is a v2 concern. That objection does not transfer: a column width in a cookie is per-browser, so the household's two members hold different widths without either of them configuring anything.

## Consequences

**The detail column is squeezed at the bottom of the split range.** With a default a little above the stack threshold and a 256-pixel sidebar, an iPad in landscape (1035 effective pixels) leaves the detail column around 230 — well under what ADR-0019's "one editable document" wants. The container query is what makes this survivable rather than broken: the user can drag the list to its floor and the rows restack rather than truncate. Raising the breakpoint so both columns always fit would have dropped iPad landscape into the compact layout, which is the outcome ADR-0017 bent the breakpoint to avoid.

**The guarantee is proved against a model, not a browser.** The repository runs one node-only Vitest suite; there is no jsdom and no browser harness. The geometry module's arithmetic is unit-tested and the CSS is asserted to reference the same constants, but nothing verifies that a Tailwind class behaves as the module assumes. A class-behaviour surprise — which is what the original defect was — would still get through. Adding Playwright was considered and deferred as its own decision rather than a side effect of a layout fix.

**The splitter's drag has no test seam.** Its markup and attributes are asserted; the drag itself is verified by hand. This is the sharpest cost of having no browser harness and is recorded here so the next person does not mistake the gap for an oversight.

**Summary length stays an editorial constraint.** The guarantee protects 24 characters, not the whole summary. Longer summaries still truncate at the deepest rung, and the full text remains one click away on the detail view.

**The list column's border becomes the splitter.** A container query measures the content box, so a border on the column would desynchronise the width the rows measure themselves against from the width the splitter sets. The splitter is the hairline between the columns now — one element doing one job, rather than a border and a drag target that have to agree.

**The guarantee covers the deepest rung, so two cases sit outside it.** The `{n} settled` chip appears only on a collapsed parent, and the deepest rung has no children, so it never competes with the guaranteed budget — but a shallower row carrying it can fall below. And the compact layout's column is not governed by the floor at all, so a 390-point phone gives the deepest rung less than the budget. Both were true before this ADR and remain true after it; the guarantee was written against the deepest rung in the split layout because that is where the defect was, and widening it is a separate decision.
