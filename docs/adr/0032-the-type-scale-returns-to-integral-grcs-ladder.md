# The type scale returns to integral-grc's ladder

ADR-0014 adopted integral-grc's design system. ADR-0017 then amended it on exactly one rung, moving `body` from 14 pixels to 16, on the grounds that "at 14px on a 15-inch laptop the register read as cramped rather than dense". Every other role stayed where integral-grc put it, so the scale has since been one system with one rung pushed out of line.

**The amendment is reversed. `body` returns to 14 pixels and the rest of the ladder follows it down.** The scale is integral-grc's again, unmodified:

| Role          | Recipe                                          | Size |
| ------------- | ----------------------------------------------- | ---- |
| `heading-page`| `text-xl font-semibold`                         | 20px |
| `heading-section` | `text-lg font-semibold`                     | 18px |
| `heading-sub` | `text-base font-medium`                         | 16px |
| `body`        | `text-sm`                                       | 14px |
| `body-strong` | `text-sm font-medium`                           | 14px |
| `caption`     | `text-xs` — **the floor for ordinary text**     | 12px |
| `micro-label` | `text-[10px] font-bold uppercase tracking-wide` | 10px |

Headings do not move: they were already at integral-grc's sizes. Only `body`, `body-strong` and `caption` shift, and `heading-sub` recovers its distinction from size rather than weight, which is what ADR-0017's amendment had cost it.

## Why the earlier judgement is being overturned

ADR-0017's reasoning was about a 15-inch laptop reading a page of text. It did not consider the surface where the extra rung is actually paid for: a dense outline in a narrow column, where every role on the row competes for the same horizontal budget. ADR-0031 measured that budget and found the Summary allocated a negative one at the deepest rung.

The extra rung is not the cause of that defect and this ADR does not claim it is — ADR-0031 fixes the tree on its own terms and would have fixed it at any type size. What the tree established is that the register has a cost that ADR-0017 did not price, and that the app is a dense work tool more often than it is a page of prose. DESIGN.md has always said so: "dense, professional, calm and precise, closer to a serious work tool than a consumer to-do app". Fourteen pixels is what that sentence means in integral-grc's vocabulary.

## The mechanism is a re-role, not a re-token

Three ways to move a scale down a rung, and they are not equivalent:

**Re-roling** — every call site moves down one class, `text-base` to `text-sm`, `text-sm` to `text-xs` — is what this ADR chooses. It costs churn across roughly 127 call sites and buys two things: the class strings in the codebase stay identical to the recipes in integral-grc's spec, which defines them as "the exact Tailwind class string engineers type", and nothing outside typography moves.

**Re-tokening** — redefining `--text-base` to 14 pixels and leaving the call sites alone — was rejected because it makes the class names lie. `text-sm` would mean 12 pixels, and every integral-grc recipe would need mental translation forever, to save a mechanical edit once.

**Changing the root font size** to 14 pixels was rejected because it is not a typography change. Tailwind v4's breakpoints are rem-based, so `lg` would move from 1024 pixels to 896, and windows between 896 and 1023 would newly receive a split layout with 640 pixels for two columns. The 4-pixel spacing scale would shrink with it. ADR-0017 named this coupling precisely — "the type scale moves it, which makes the type scale and the breakpoint one decision rather than two" — and the way to honour that warning is to leave the root at 16 pixels, not to trigger the coupling deliberately. This matters doubly now that ADR-0031 has tuned column geometry against a 1024-pixel split.

## `micro` is retired

The old floor was 14 pixels with two sanctioned roles beneath it: `micro` at 11 and `micro-label` at 10. With the floor at 12, `micro` sits one pixel below it. That is not a typographic tier; nobody can see a one-pixel step, and its only remaining defence would be that integral-grc has one — which is copying a decision rather than making it.

**`micro` is retired and its users converge up to `caption`.** Its only justified use was the Search tab's results table, which gains a pixel in the process: 12 rather than 11. `design-lint` drops `text-[11px]` from its allowed set, leaving `text-[10px]` as the single sanctioned arbitrary size, justified purely by geometry — text that must fit a fixed shape, such as an avatar's initials or a badge inside a tree row.

## Form controls are pinned on coarse pointers

iOS Safari zooms the page whenever a form control with a font size under 16 pixels receives focus, and the viewport meta carries no `maximum-scale` to suppress it. `Input`, `Textarea` and `Select` are 14 pixels today, so this already happens — tapping Summary in the Creation Dialog zooms the page. The bug predates this ADR; re-roling to 12 would deepen it.

**Form controls are pinned to 16 pixels on coarse pointers**, via `[@media(any-pointer:coarse)]:text-base`. Desktop keeps the dense register; touch stops zooming. The idiom is already established in the codebase — the dialog's close button uses the same query to earn a touch-sized target — so this is an application of an existing rule rather than a new one.

Adding `maximum-scale=1` to the viewport meta was rejected outright: it would fix the zoom by removing pinch-to-zoom from anyone who needs it.

The cost is that a control's text no longer matches its label's size on touch devices. That is the correct trade, because the label is not the thing that triggers a 1.3× zoom when tapped.

## The compact navigation capsule

The bottom navigation's labels follow the ladder to 12 pixels rather than being pinned, on the household's judgement that the capsule reads as oversized. Its icons go with them: they are the only icons in the codebase with no size class at all, rendering at Lucide's 24-pixel default while everything else is constrained to 16. They become 20 — still clearly dominant, since these are the one place an icon carries meaning without adjacent text, but a chosen size rather than an unconsidered default. The tap target is unaffected, being governed by the pill's padding rather than the glyph.

## Consequences

**ADR-0031's constants are recomputed.** Its geometry is derived from a Summary at 16 pixels and a due date at 14. Both drop a rung, so the 24-character budget falls from 194 pixels to 170 and the date from 52 to 39. The stack threshold moves from 536 to 504 and the floor from 416 to 388. This is the geometry module earning its keep on its first day: a few numbers change and the unit test re-proves the guarantee.

**The gap between the floor and the smallest sanctioned text narrows to 2 pixels.** `caption` at 12 and `micro-label` at 10 are adjacent rungs now. `micro-label` survives because it is distinguished by weight, case and tracking as well as size, not by size alone — which is exactly the argument `micro` could not make.

**The register is a judgement and can be judged again.** ADR-0017 reversed this rung once and this ADR reverses it back. Anyone reversing it a third time should say what changed beyond taste, and should price the tree row before doing so.
