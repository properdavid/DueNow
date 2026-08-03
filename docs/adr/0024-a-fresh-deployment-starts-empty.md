# A fresh deployment starts empty

A newly deployed DueNow contains **no work items, no Labels, and no users**. Nothing is seeded except the one row the schema cannot do without.

## Nothing in the tree, nothing in the vocabulary

ADR-0016 (no delete in v1) is what settles this. Terminal statuses are v1's only answer to "this should not exist", so a seeded Topic is permanent: the household's escape is to Close it, which leaves a Closed Topic in their tree forever and sweeps any seeded children with it under the Settle Cascade. Seeded content in an app without delete is not a suggestion — it is furniture bolted to the floor. The Topics named in `CONTEXT.md` (Travel, House, Celebrations, Cleaning) are illustrative vocabulary, not shipped rows.

Labels are the one seedable thing that would be reversible — a Label may be deleted even while in use — but they start empty too. A Label vocabulary is a guess about how *this* household slices its work, and Labels are creatable inline from a work item, so the first one costs a few keystrokes at the moment it is actually wanted. An empty vocabulary costs nothing on any surface: Labels appear only on the Detail View and as a Filter Bar dimension.

There is **no product surface that loads example data**. A "load examples" control would be the same trap with the safety off — one tap inserting a dozen work items v1 cannot remove. Development and volume testing use a seed script instead, which is a repo concern and not part of the product.

## Users are still lazy

ADR-0004's lazy creation stands: no user row is minted from `ALLOWED_EMAILS` at boot. A row created from an env var carries an email and nothing else — no display name, no Google avatar — so it would render as a raw email string on every Assignee chip, Due Card and Results Table row, and ADR-0019's inverted-avatar atom would have nothing to draw. It would also make the database a mirror of an env var, so editing the allowlist later leaves rows no v1 surface can remove. Being able to see that your partner has not signed in yet — which the Settings member list gives — is worth more than being able to assign work to someone who has never opened the app.

## The Household Settings row is seeded, from the server's timezone

The single-row settings table (`CHECK (id = 1)`) must hold a row before the first request, because ADR-0008 makes every Due tab render depend on the Household Timezone. That row is created by the migration, and its timezone defaults to the server's own resolved zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`), falling back to `UTC` only if that yields nothing.

A hardcoded `UTC` was rejected. UTC midnight lands mid-afternoon for a US household, so **Today** would roll over a day early and the Due tab would be quietly wrong in a way nobody would attribute to a setting they had never opened. Supportive's pinned `America/Los_Angeles` was already dropped, so re-pinning a literal is not available either. A self-hosted box almost always sits in the household's own timezone, so the default is right without anyone touching it, and Settings remains the correction. Tests pin `TZ` so migrations stay deterministic.

## Empty is two states, not one

Because there is no delete, the corpus is a **one-way door**: once the first Topic exists it can never return to zero rows. So every surface that can render nothing renders nothing for two unrelated reasons, and they are distinct states with distinct copy. The test is always whether any work item exists at all — never whether any row is currently visible.

- **The Work Items Tree.** *First Run* means nothing has ever been created and is the only place onboarding language belongs. *All settled* means every Topic is terminal and hidden behind ADR-0018's per-parent settled reveal — zero rows plus a reveal, which looks identical and means the opposite.
- **The Due tab.** *First Run* again, versus *nothing within the Horizon* — which for a household on top of its work is the normal, healthy steady state, recurs constantly, and should read as reassurance rather than absence, with no create prompt attached.

Both pairs are handed to the empty-states work (#24), alongside the sign-in screen and the unselected Split Layout column.

## The landing tab does not move

A brand-new household lands on the Due tab, like everyone else. Routing to Work Items while the corpus is empty was rejected: a home that silently relocates once is disorienting exactly when the household is forming its model of the app, it would be the only state-dependent route in ADR-0022's "the URL is the screen", and it fires once in the deployment's lifetime. The Due tab's First Run empty state carries the invitation instead, handing off to the Creation Dialog that ADR-0017's single creation entry point already puts on every tab.
