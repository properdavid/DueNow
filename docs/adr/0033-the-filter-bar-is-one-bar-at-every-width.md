# The Filter Bar is one bar at every width

The Search tab has **one** Filter Bar. Below ADR-0017's breakpoint it wraps to as many rows as it needs; it does not move behind a button, and there is no sheet, no draft and no Apply. A filter value applies the moment it is chosen, at every width, exactly as ADR-0021 already specified for the wide bar.

**This supersedes ADR-0021's compact-layout paragraph on filters and sort.** Three of its sentences no longer hold: filters do not move behind a Filters button, the sheet does not batch behind Apply, and Sort does not sit at the top of the sheet.

ADR-0021's reason for the batch was that "on a phone the results are hidden behind it, so filtering live would update a list nobody can see." That reasoning was sound **against the artefact it described** — an opaque sheet covering the whole screen. It does not survive the sheet's removal. A wrapped strip of six dropdowns obscures the results only while one panel is open, the panel dismisses itself on outside-press, and each control's label already carries its own state (`Type: Task, Subtask`), so the filter state is legible without looking at the results at all. What the batch cost was a second commit model, a second set of controls, an Apply whose necessity was never visible, and no way to reset.

**Sort Order moves to the Result Count line**, as `7 work items` with a `Sort: Due ↓` control opposite it. ADR-0021 put sort at the top of the sheet on the grounds that it is "one choice out of seven rather than a set of narrowing decisions" — that argument survives its container and is in fact why sort cannot simply become a seventh chip in the strip. Sort belongs to the Results Table, so it is presented with the results. Its panel lists the seven columns and then Ascending/Descending, each with the same check the filter menus use; choosing `#` returns both the column and the direction to their defaults, because descending creation order is not an order anyone asks for.

**Panels are full-width of the bar on compact.** `FilterMenu` positioned its panel absolutely against its own chip, which overflows the viewport for any chip wrapping to the right of a row. The chip is `relative` only at the breakpoint and above, so below it the panel resolves against the bar instead — overflow becomes impossible by construction and every panel opens in one predictable place under a thumb.

**A Clear control appears as a final chip when any filter is on**, and clears filters only. Sort Order has its own control on its own line and is not reached by it. Clear does not exist when there is nothing to clear, and appearing last means setting a first filter never shifts the six that are already placed.

**There is still no count on anything.** ADR-0021's reasoning holds unchanged — a count must choose between counting dimensions and counting values, and neither says anything the chips do not. A control reading `Any` is off; a control naming a value is on, and carries the accent fill to say so.

## Consequences

**Six filters cost six navigations on a phone.** This is the price of the single commit model and it is paid knowingly. Against synchronous `better-sqlite3` on a self-hosted box the round trip is single-digit milliseconds (ADR-0022), which is the only reason the price is affordable.

**The compact filter code is deleted, not adapted** — `CompactFilters`, `CompactSort`, `CompactSelect`, `CompactParentSelect` and `CompactDue`, along with the `Dialog`, `Fieldset` and `Select` primitives' only use on this tab. `searchPathFromForm` and `PreservedInputs` survive, but now serve the Keyword box alone, which is the one control on the bar that still waits for a submit. The Search tab's filter state is the URL and nothing else, on every surface.

**The `Filters` button's missing bold is moot.** ADR-0021 specified it as "bold, in the primary colour" and the code only ever shipped the colour; the button ceases to exist rather than getting fixed.

**The purple-default button treatment is not part of this.** Making `outline` buttons primary-bordered app-wide, with fill reserved for "something is selected behind this", was raised alongside and deliberately split out: it lands on every screen and needs judging on its own. It was settled by ADR-0034, which took the border but gave fill a different meaning — a fill commits to stored data, and a Chip carrying a value is Set and tinted.
