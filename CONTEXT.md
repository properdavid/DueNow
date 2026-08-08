# DueNow

Household project management for a two-person household — a hierarchy of work items, each with an owner, a status, and a due date, surfaced by what is due soonest.

## Language

### The household

**Household**:
The two people who share this deployment. One running instance serves exactly one household; there is no household entity in the model because there is never more than one.
_Avoid_: family, tenant, organisation, workspace, account

**First Run**:
A deployment before any work item has ever been created in it. It ships with no work items, no Labels and no users — only the Household Settings row. Because nothing can be deleted, First Run is a one-way door: once the first Topic exists the deployment has left it for good, and a screen showing nothing thereafter means something else entirely.
_Avoid_: onboarding, setup, empty state, fresh install, day one

**Avatar**:
The disc that stands for a household member wherever one is named — tree rows, Due Cards, Search rows, Comments, Settings. It carries a single uppercased character taken from the member's name, never a photograph; DueNow stores no picture and fetches none. Yours is a solid indigo disc with the character knocked out and your partner's is the soft fill, so the two are told apart by fill rather than by hue. Unassigned is the dashed disc, carrying no character.
_Avoid_: profile picture, photo, gravatar, icon, initials badge

### Work items

**Work Item**:
Anything trackable in DueNow — a single node in the tree. The generic term for all four types below.
_Avoid_: item, ticket, issue, card, entry, to-do

**Topic**:
The broadest work item, grouping everything under a common theme. Sits at the root with no parent. Examples: Travel, House, Celebrations, Cleaning.
_Avoid_: category, area, folder, epic

**Project**:
A work item under a Topic, representing an undertaking with its own arc. Examples: San Diego Trip, Replace Patio Cover, Kitchen.
_Avoid_: initiative, goal, milestone

**Task**:
A work item under a Project — a discrete piece of work. Examples: Book lodging, Get patio cover quotes.
_Avoid_: action, item, story

**Subtask**:
The narrowest work item, under a Task. Examples: Research Airbnbs, Call contractor 1.
_Avoid_: step, child task, sub-item

**Type Ladder**:
The fixed ordering Topic › Project › Task › Subtask. Every work item except a Topic has exactly one parent, of exactly the type one rung above it. There are no orphans and no additional rungs.
_Avoid_: hierarchy, tree depth, levels

**Ancestors** / **Descendants**:
The work items above an item on its path to its Topic, and everything beneath it. A work item's **subtree** is the item plus its descendants.
_Avoid_: parents (plural), children (when meaning more than one rung), lineage

**Reparent**:
Moving a work item under a different parent of the same type it already sits under — a Task moves to another Project. The work item carries its subtree with it, and no type changes. It is reached from the Detail View's Parent Chip, which names the parent rather than the act, so the word itself appears on no screen — except the Work Items tree row menu label **Move…**, where the affordance names the action in the tightest possible row-menu language.
_Avoid_: move, re-assign, transfer

**Promotion** / **Demotion**:
Changing a work item's type, shifting it and its whole subtree one rung up or down the ladder — a Task that turns out to be a Project. Not in v1; the term is reserved so that retyping, when it arrives, is not confused with Reparent.
_Avoid_: convert, change type, move up a level

### Fields

**Core Fields**:
The fields every work item carries, whatever its type — Summary, Description, Assignee, Status, Due Date, Labels, Comments. No type withholds one and no type adds one.
_Avoid_: attributes, properties, metadata, standard fields

**Summary**:
The one-line name of a work item, and the only thing a person must supply to create one.
_Avoid_: title, name, subject, heading

**Description**:
The long-form detail of a work item, written in Markdown. Bounded only by a fence the writer never sees — 20,000 characters, which exists against a mispaste rather than against a writer.
_Avoid_: body, notes, details, content

**Assignee**:
The single household member responsible for a work item. Optional, and never inherited from an ancestor.
_Avoid_: owner, responsible party, reporter, watcher

**Unassigned**:
A work item with no assignee. An expected, first-class state meaning neither person has taken it — not an omission awaiting correction.
_Avoid_: unowned, orphaned, nobody, empty

**Due Date**:
The calendar day by which a work item is expected to be finished. A whole day, never a time of day. Optional, and independent of any ancestor's or descendant's.
_Avoid_: deadline, target date, due by, ETA

**Label**:
A named tag from one household-wide managed set, applicable to a work item of any type. Its name is a word or two — 30 characters, and the cap is one you feel as you type. A Label carries no colour, and is displayed only on a work item's detail view; everywhere else it is criteria in the Filter Bar rather than something a row advertises.
_Avoid_: tag, category, keyword, flag, component

**Comment**:
A Markdown note written by a household member on a work item, belonging to its author and editable and deletable only by them. It is never empty, and carries the same unseen 20,000-character fence as a Description. An edited comment is marked as edited and nothing more — there is no edit time and no revision list. Only people write comments; the system never does.
_Avoid_: note, reply, message, activity, update

### Status

**Status**:
Where a work item stands: **Open**, **In Progress**, **Completed**, or **Closed**. Every work item has exactly one.
_Avoid_: state, stage, progress, workflow step

**Open**:
Not started.
_Avoid_: to do, new, backlog, not started

**In Progress**:
Work has begun.
_Avoid_: active, started, doing, WIP

**Completed**:
Terminal, and **achieved** — the outcome was reached.
_Avoid_: done, finished, resolved, complete

**Closed**:
Terminal, and **not achieved** — a duplicate, a won't-do, or no longer relevant. Closed is not a worse Completed; it records a different outcome, not a lesser one.
_Avoid_: cancelled, abandoned, archived, rejected, dropped

**Terminal**:
Completed or Closed — the two statuses that mean the outcome is settled and no further work is expected.
_Avoid_: done, closed (as a grouping), final, resolved, inactive

**Unfinished**:
Open or In Progress — the two statuses that mean an outcome is still expected.
_Avoid_: active, incomplete, outstanding, live, pending

**Terminal Subtree Invariant**:
A terminal work item never has unfinished descendants. Holds at all times, so a work item's terminal status is a trustworthy statement about its whole subtree.
_Avoid_: completion rule, status consistency

**Cascade**:
A status change on one work item propagating to others. Two exist, and nothing else propagates.
_Avoid_: rollup, sync, inheritance, trigger

**Settle Cascade**:
The downward cascade. Making a work item terminal carries that same status onto every unfinished descendant, leaving already-terminal ones as they are.
_Avoid_: completion cascade, bulk close

**Start Cascade**:
The upward cascade. Moving a work item to In Progress walks up its ancestors, moving each Open one to In Progress, and stops at the first that is already In Progress.
_Avoid_: promotion, parent rollup

### The shell

**Compact Layout**:
The navigation shell below 1024px — content full width, a floating capsule of four tabs at the bottom, and a work item opening as a full-screen push. What a phone gets, and what a tablet in portrait gets.
_Avoid_: mobile, phone layout, small screen

**Split Layout**:
The navigation shell at 1024px and above — a left sidebar of four destinations beside a resizable two-column split, the destination's list on the left and the selected work item's detail on the right. What a desktop gets, and a tablet in landscape.
_Avoid_: desktop layout, two-pane, master-detail, wide screen

**Wordmark**:
The name set as type — DueNow, Inter semibold, tracking tight, in the primary indigo — and nothing beside it. It appears over the sign-in card and in the Split Layout's sidebar header, and nowhere else; the App Icon never accompanies it.
_Avoid_: logo, logotype, brand, lockup

**App Icon**:
The square DueNow installs as — two white ticks down the left, D over N down the right, on the primary indigo, edge to edge. One artwork at every size the manifest ships, favicon included.
_Avoid_: logo, favicon (for the artwork itself), launcher icon, app mark

**Surface Mark**:
The picture at the top of an empty card, saying which surface came up empty — a list for the tree, a check for *All settled*, a clock for the Due tab, a split pane for the unselected column. It is a picture of the surface, never the App Icon, and it appears on no populated screen.
_Avoid_: empty state icon, illustration, placeholder art, brand mark

**Unreachable State**:
What DueNow shows when it cannot reach the server — a message and a Retry, worn by a cold launch with no connection, a navigation whose data never arrives, and a save that never lands. It names the symptom and never the cause: the household runs one instance, so a dead box and a dead connection are the same fact, and nothing on screen claims to tell them apart.
_Avoid_: offline mode, offline state, disconnected, network error

**Update Banner**:
The notice that a newer DueNow has been deployed, offering to switch to it. It waits to be accepted rather than reloading on its own, because unsaved text is a normal state of the Detail View.
_Avoid_: update prompt, upgrade toast, new version banner

### The Work Items tab

**Work Items Tree**:
The whole ladder drawn as one indented outline, every rung a row of the same list. It opens fully collapsed, showing Topics only, and what you expand is forgotten when you leave.
_Avoid_: outline, hierarchy view, browser, explorer

**Type Mark**:
The small shape that says which rung a work item sits on — amber star Topic, violet diamond Project, green square Task, teal triangle Subtask. Never a circle and never blue, both of which belong to the Status Mark.
_Avoid_: type icon, badge, glyph, bullet

**Status Mark**:
The small circle that says where a work item stands — empty grey ring Open, half-filled blue In Progress, blue check Completed, filled grey Closed. Shape carries the meaning as much as colour does, so the four read apart without hue.
_Avoid_: status icon, dot, chip, indicator

**Creation Dialog**:
The single dialog every work item is created through, wherever it is opened from — type, then Summary, then a Parent select filtered to the one rung that fits, then the rest of the core fields. Type, Summary and Parent are required; a pre-filled dialog fills only those, never a status.
_Avoid_: new item form, create modal, add dialog, quick add

**Parent Picker**:
The typeahead that chooses a work item's parent, filtering by Summary as you type and showing each candidate's own lineage so two "Kitchen"s can be told apart. One control, used in three places — the Creation Dialog, reparenting, and the Filter Bar's parent control — and always confined to the one rung that can legally be a parent.
_Avoid_: parent select, parent dropdown, item picker, autocomplete

**Reopen Notice**:
The inline notice a Creation Dialog or Parent Picker grows when a terminal parent is chosen, naming the ancestors that confirming will move back to In Progress. It informs rather than gates — the escape is choosing a different parent.
_Avoid_: warning, prompt, alert, confirmation

### The detail view

**Detail View**:
The whole of one work item on one surface — breadcrumb, Summary, Property Chips, Description, children, Comments — in that order, the same for all four types. The only place a work item is settled — from its own Status Chip, or from its parent's Children Checklist — and the only place Labels are shown.
_Avoid_: item page, work item page, record, form, inspector

**Chip**:
A control that is the value *and* the control: it names what it currently holds, and tapping it opens a picker. Three of them — the Search tab's Filter Chips, the Detail View's Property Chips, and the Due tab's scope.
_Avoid_: pill, tag, badge, toggle

**Set**:
A Chip that names a value rather than `Any`, `Unassigned` or `No Due Date`. A Set chip carries a tint to say so, but the name it carries already says it — the tint never carries the meaning alone. A Chip with no unset state to contrast against is neither Set nor unset and never tinted, because a tint that never varies says nothing.
_Avoid_: active, applied, selected, on

**Property Chip**:
One of the five Chips under the Summary — Parent, Status, Assignee, Due Date, Labels. The choice commits at once, with no edit mode and no Save. Parent leads, and is the one Chip that names a position on the Type Ladder rather than a Core Field; a Topic, which can have no parent, shows no Parent Chip at all.
_Avoid_: field, property panel, pill, tag

**Settle Confirmation**:
The popover that opens under the Status Chip, or under a Children Checklist row, when settling a work item that still has unfinished descendants, naming every one it will sweep. It appears only when there is something to sweep, and nothing changes until it is confirmed. The Start Cascade has no equivalent — it is announced in the picker, not gated.
_Avoid_: confirm dialog, warning, are-you-sure, undo prompt

**Children Checklist**:
The children of a work item as they appear on its Detail View — Status Mark, Summary, Due Date, Assignee per row, ending in the settled reveal and an inline add. Its Status Mark is a toggle that settles a child to Completed and un-settles one to Open; no other status is reachable from it.
_Avoid_: subtask list, child list, checkbox list, todo list

**Comment Composer**:
The closed affordance at the foot of a Detail View's Comments that opens into a box for writing one. It starts closed and returns to closed — a Detail View at rest offers to take a Comment rather than standing ready to receive one.
_Avoid_: comment box, comment form, reply box, add comment

**Draft**:
Text a household member has typed and not yet stored. Every long-form field is written through one — Summary, Description, and a Comment — and every Draft ends the same way: Saved, or Discarded and gone. A Draft belongs to the work item it was opened on and never travels; leaving takes it with nothing. Chips have no Draft, which is why they have no Save.
_Avoid_: unsaved changes, edit mode, pending edit, dirty state

### The Due tab

**Overdue**:
Unfinished with a Due Date earlier than Today.
_Avoid_: late, past due, missed, expired

**Covered**:
Having an unfinished descendant whose Due Date falls on or before your own. A covered work item stays off the Due tab, because something beneath it is already carrying that deadline and is the actionable one. Covered is judged against what the Due tab is currently showing, not against the whole tree.
_Avoid_: superseded, shadowed, rolled up, hidden, subsumed

**Due Now** / **Due Soon** / **Due Later**:
The three groups of the Due tab. Now is due today or Overdue, Soon is the next seven days, Later is the twenty-three days after that. All three roll forward from Today rather than aligning to a calendar week or month.
_Avoid_: urgent, upcoming, this week, buckets, windows

**Horizon**:
Thirty days from Today. A Due Date beyond it puts a work item on no Due tab group at all; the tab is a view of what is approaching, not an inventory of every date. The Horizon looks forward only — however overdue a work item is, it stays in Due Now.
_Avoid_: cutoff, range, limit, lookahead

**Due Card**:
One work item as it appears on the Due tab — breadcrumb, Summary, and a meta line of due date, Status Mark and Assignee, inside a bordered box with an Urgency Edge. Cards are the same size in all three groups; a Due Card carries no Labels and nothing on it can be changed.
_Avoid_: row, tile, entry, list item

**Urgency Edge**:
The coloured stripe down the left of a Due Card — red Overdue, amber due today, faint indigo within seven days, grey beyond. Amber belongs to today alone, which is the last day a deadline can still be met.
_Avoid_: priority colour, accent bar, severity, highlight

**Lateness**:
How far past its Due Date an Overdue work item is, written in words on its Due Card — "2 days late", "7 weeks late". It rounds as it grows: days, then weeks, then months.
_Avoid_: age, delay, days overdue, slippage

### The Search tab

**Filter Bar**:
The fixed set of controls that narrows the Search tab — keyword, type, status, assignee, parent, due date, and labels. One bar at every width, wrapping rather than hiding below the breakpoint, and a value chosen takes effect at once: there is no draft and nothing to apply. Values chosen within one control widen the result; every control narrows it against the others. There is no nesting and no OR across controls.
_Avoid_: query builder, advanced search, facets, criteria

**Keyword**:
Text matched against a work item's Summary and Description, never its Comments. Every word typed is the *start* of a word in the work item, and several words match a work item carrying all of them, in any order. It takes literal words only — punctuation and operators carry no meaning, so a Keyword can never be malformed.
_Avoid_: search term, full-text search, query, phrase

**Result Count**:
The number of work items the current Filter Bar matches, shown above the Results Table whether or not the table is showing all of them. Where the count exceeds what the table draws, it states both — the true total is never hidden.
_Avoid_: total, hits, matches, rows

**Preset**:
A saved Filter Bar configuration, recalled by name. Not in v1 — the term is reserved so that saved filters, when they arrive, are not called something else.
_Avoid_: saved search, saved filter, view, smart list

**Results Table**:
The Search tab's rendering of its results — one row per work item, seven columns, sortable from every header, taking the whole window on a wide screen. Its compact form is a stacked row carrying the same fields minus the columns. It draws at most two hundred rows, taken after the Sort Order is applied, and says so when there are more.
_Avoid_: grid, list view, data table, issue navigator

**Sort Order**:
The single column the Results Table is ordered by, plus its direction. Chosen from the column headers in Split Layout and from the Result Count line in Compact Layout, where there are no headers to click. Every column can carry it; Status orders down the Type Ladder's statuses rather than alphabetically, and Unassigned, undated and top-level rows sort last in both directions.
_Avoid_: ordering, ranking, sequence

### Settings

**User Settings**:
The settings that belong to one household member and follow them rather than the deployment — currently the Theme. Named for the scope, not the reader: the section says **User** where an app with an account would say "You" or "Profile", because what distinguishes it from Household Settings is who a change reaches, not who is looking at it.
_Avoid_: you, your settings, profile, preferences, account

**Household Settings**:
The settings both members share, where one person's change is the other's change too — the Household Timezone, the Label set, and the members themselves. There is exactly one row of them, present from First Run.
_Avoid_: global settings, app settings, admin, workspace settings

**Household Timezone**:
The single timezone the household shares, stored once and editable in Settings. It starts as the timezone of the server the household deployed onto, and there is no per-user or per-work-item timezone.
_Avoid_: local time, server time, user timezone, locale

**Today**:
The calendar day in the Household Timezone. The only thing a Due Date is ever compared against, so overdue and due-today mean the same thing to both household members.
_Avoid_: now, current date, the current time
