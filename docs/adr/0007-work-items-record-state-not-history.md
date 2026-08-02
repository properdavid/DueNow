# A work item records its current state, not its history

A work item stores what is true now — its status, its assignee, its dates — plus who last changed it and when. It keeps no log of what changed, no record of when it was completed, and nothing survives deletion: there is no activity feed, no `completedAt`, and no soft-delete tombstone. Comments are written by people about the work, never by the system about itself.

The alternative — an event log rendered into the work item's comment stream, the way an issue tracker normally does it — was rejected for v1 on two grounds. It is a second entity with its own retention, rendering, and permission questions, and it interacts badly with the Settle Cascade: completing a Project would spray machine-written entries across every descendant it swept, burying the handful of human comments that actually carry meaning. A stored `completedAt` fails for the same reason — under a cascade it records the sweep rather than the doing, which is a worse signal than the plain last-updated timestamp already available.

## Consequences

This is the one decision here that cannot be undone retroactively: history not written is history lost, so a later history feature starts from the day it ships and can say nothing about what came before. That is accepted deliberately — a two-person household has no audit obligation, and the cost of guessing wrong at the shape of a history feature is higher than the cost of a late start.

"Who did this" is answered by the last-updated attribution, which every write sets, including cascaded ones. When history does arrive it will be its own surface, deliberately separate from comments rather than merged into a single stream.
