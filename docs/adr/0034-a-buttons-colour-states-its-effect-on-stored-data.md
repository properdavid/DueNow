# A button's colour states its effect on stored data

A button's colour says what clicking it does to the database, not how important it is. **Hue is valence** — indigo constructive, red destructive, grey neither. **Fill versus border is persistence** — a fill commits, a border leads toward. Seven variants, named for the effect rather than the emphasis: `write`, `open`, `destroy`, `discard`, `neutral`, `bare`, and `inline` for a click target on content.

**This supersedes ADR-0014's emphasis ladder for buttons.** `default`, `secondary`, `outline` and `ghost` named a rank; they are gone. `secondary` is retired outright — a grey fill has no cell in the new table, and its three call sites in Settings were writes wearing the wrong name.

**"One primary action per view" is retired with them.** Under the old rule `primary` was rationed by importance, which is why every other button on a screen was a monochrome outline that blended into the card behind it. Fill is now earned by persistence: a screen carries as many `write` fills as it has ways to change stored data. On the Detail View that is fewer than it sounds — Save, Confirm and the like are conditionally rendered, so a resting screen shows about two.

**The mechanical test is ADR-0022's verb-shaped resource routes.** A button either posts to an `api.*` action or it does not. Sign-out posts to `/auth/logout` and takes `discard` rather than an exception: a session is user-produced state with no adjacent control that restores it, which is exactly what `discard` means.

**The two hues are deliberately asymmetric.** Anything that opens a picker or dialog leading to a write carries the indigo border — you are *led toward* a write. But a button that merely opens a delete confirmation is `neutral`: you are *gated before* a delete, and the confirmation is the warning. Warning twice is noise, and it would give the red border two meanings, which is the failure we rejected for fill.

**The scheme colours chrome, not content.** A click target on a heading, a paragraph or a row summary takes `size="inline"` and no bucket. This is what keeps ADR-0019's "one editable document" from becoming a form, and it is why the primitive gained an `inline` size rather than letting call sites override six base classes by hand.

**Menus are exempt.** A menu is already a committed context — you opened it to choose — so a menu item that writes takes no fill.

## Consequences

**The FAB is the one named exception.** It carries the `write` fill even though it opens a dialog, because it is the app's standing invitation to create and has no label to carry that meaning. It is the only place where a fill does not mean "this click commits", and it is written down so the next reader does not mistake it for an oversight.

**`MenuTrigger` was silently discarding the variant of every chip it wrapped.** With `asChild`, Radix applied the trigger's own `border-transparent text-muted-foreground` after the child's classes, so all four Property Chips rendered borderless grey no matter what the call site asked for. That bug — not the design system — was a direct cause of the complaint that started this work. The trigger now defers to its child when `asChild` is set.

**The Children Checklist toggle is a Chip, not a write.** Its fill would sit behind the Status Mark and swallow it. It is `open` and correctly so: when a child has unfinished descendants or a reopen notice, the toggle opens the Settle Confirmation rather than writing, and the Confirm inside it carries the fill.

**Every bare `<button>` styled as a control is gone.** The Due tab's scope toggles became a Chip and the Detail View's editor triggers took `size="inline"`, so the scheme has no silent opt-outs to erode it.

**Indigo is no longer scarce.** It already carried the primary action, the active navigation item, the focus ring and the Wordmark; it now also carries every control that leads toward a write. The focus ring gained `ring-offset-2` so it still reads against an indigo edge. `text-primary` on `card` measures 7.22:1 in light and 4.80:1 in dark — AA everywhere, AAA in light only, which is the cost of putting primary text on chrome and is accepted.

**The variant table is asserted in [tests/design-system.test.ts](../../tests/design-system.test.ts)**, so the table in `DESIGN.md` cannot drift from the primitive. `neutral` is the default variant, so an unclassified button never claims to write.

**The three candidate palettes are kept on `prototype/effect-coloured-buttons`**, out of main. The scheme shipped here is variant B; the muted-fill alternative was rejected because a tinted commit button stopped reading as the committing action.
