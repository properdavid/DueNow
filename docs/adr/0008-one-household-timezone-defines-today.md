# One household timezone defines today

The household has a single timezone, stored in the database and editable in Settings, seeded from the server's timezone when the schema is first migrated. It is the only answer to "what day is it" anywhere in the app.

ADR-0005 made due dates whole days, which pushed the timezone question off the work item and onto the reader: a date-only due date only becomes "overdue" or "due today" relative to some midnight, and something has to say whose. The alternatives were a deploy-time environment variable, which is how Supportive pinned `America/Los_Angeles` and which needs a redeploy to correct a wrong guess, and computing the day in the browser, which cannot work on a server-rendered Due tab without a cookie round-trip or a hydration correction. Neither is cheaper than one row in a table, and both hide a decision the household should be able to see. Per-user timezones were rejected for the same reason ADR-0005 rejected per-item ones — two people sharing a house share a calendar day.

## Consequences

The Due tab computes its buckets on the server against a timezone it can read synchronously, so the first paint is correct and needs no client-side correction. Every date comparison in the application funnels through one value, which makes "what does the app think today is" a single testable input rather than an ambient property of whichever machine is running.

Because the setting is user-editable, the app cannot treat it as constant within a session — a change moves the bucket boundaries for both people at once, which is the intended behaviour when a household relocates rather than an edge case to guard against.

This is the first household-scoped scalar in the system, and it establishes where such things live: a settings table constrained to exactly one row, with a typed column per setting. ADR-0001 already ruled out tenancy, so a table that cannot hold a second row states that constraint in the schema rather than in convention. Future household settings are columns on that row; the alternative — a key-value bag of strings — would move defaults out of the schema and make constraints unexpressible.
