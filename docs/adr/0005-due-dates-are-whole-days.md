# Due dates are whole days

A work item's due date is a calendar day and nothing finer. There is no time-of-day component, no per-item timezone, and no way to say a Task is due at 3pm.

The obvious alternative is a full timestamp, which is what every issue tracker DueNow resembles actually does. We rejected it because household work is genuinely day-granular — "book lodging by Friday", not "by 3pm Friday" — and anything truly tied to a clock (a contractor arriving at nine) is a calendar event that belongs in a calendar, not a work item. A timestamp would put a time picker on every item to serve a case the app does not have, and would force a timezone decision on a two-person household that shares one.

## Consequences

The Due tab's buckets turn over at midnight rather than rolling continuously, so "Due Now" reads as "due today or overdue" rather than a literal 24-hour window — a list that is stable across a morning instead of one that reshuffles hourly. Sorting and range comparison work on plain `YYYY-MM-DD` text, so no date type or timezone library is needed anywhere in the stack. Adding time later would be a migration plus a rethink of every bucket boundary, so this is a decision the Due tab is built on rather than one it tolerates.

A parent's due date constrains nothing about its children's. A Subtask may be due after the Project containing it; that is treated as a slip to fix, not an error to block, and the useful reading of the relationship — the earliest outstanding date beneath an item — is computed when needed rather than enforced on write.
