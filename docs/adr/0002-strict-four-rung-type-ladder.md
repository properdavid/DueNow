# Strict four-rung type ladder

Work items come in exactly four types — Topic › Project › Task › Subtask — and the ladder is rigid: every work item except a Topic has exactly one parent, of exactly the type one rung above it. There are no orphans, no fifth rung, and no shortcut edges such as a Subtask hanging directly off a Topic.

The obvious alternative is a generic self-nesting tree with a single work item type and arbitrary depth — simpler to model, and it never needs a migration to add a level. We rejected it because the rigid ladder is what makes the rest of the app legible: the Work Items tree has a known shape, the Due tab can reason about which rung is worth surfacing, and "Topic" and "Subtask" mean something specific to the household rather than being depth-4 accidents. A generic tree pushes that meaning into convention, where nothing enforces it.

## Consequences

Depth is a structural guarantee rather than a runtime check, so reads can rely on it. Adding or removing a rung later is a data migration and a UI change, not a config toggle. The rigidity also constrains reparenting by type, which is a real limit on how freely work items move.
