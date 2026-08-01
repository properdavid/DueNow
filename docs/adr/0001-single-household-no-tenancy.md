# Single household, no tenancy

DueNow is self-hosted: one deployed instance serves exactly one household, and people who want it deploy their own. So there is no household entity, no tenancy column on work items, and no per-household scoping on any query — a work item belongs to the instance, not to a group inside it.

The alternative was a multi-tenant app with a household entity from day one, which would make hosting a shared service possible later. We rejected it because it taxes every query and every schema in perpetuity to serve a scenario we do not want: sharing means a friend deploys their own instance. The absence of tenancy is deliberate, not an oversight — do not "fix" it by adding a household id.

## Consequences

Users are peers with no roles between them; every user sees and edits every work item. Turning DueNow into a hosted multi-household service would be a rewrite of the data model, not an extension of it.
