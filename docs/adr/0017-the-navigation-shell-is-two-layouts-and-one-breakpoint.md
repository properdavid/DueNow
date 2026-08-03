# The navigation shell is two layouts and one breakpoint

DueNow has one navigation shell expressed as two layouts, separated by a single breakpoint at 1024 CSS pixels.

Below 1024 — the **compact** layout — content fills the available width and navigation is a floating capsule pinned to the bottom centre, carrying the four destinations as icon-over-label pills: Due, Work Items, Search, Settings. Opening a work item pushes a full-screen view with a back control and the item's lineage. Creating one is a floating action button in the bottom corner.

At 1024 and above — the **split** layout — a fixed left sidebar carries the same four destinations plus a "New work item" button, and the content area is a resizable two-column split: the current destination's list on the left, the selected work item's detail on the right. Selecting a work item swaps the right column rather than navigating.

There is no tablet layout. An iPad in portrait is 834 points, so it takes the compact layout at full width — a phone with more breathing room — and rotating to landscape clears 1024 and earns the split. Capping compact content to a phone-like measure was rejected because it puts gutters on a device that has room to use; splitting from 768 was rejected because a 320-pixel list column would show *less* per row than a phone does, which inverts the point of the larger screen.

The alternatives were built and discarded. A single responsive shell — one collapsible sidebar at every width, a sheet on phones, one pane throughout — is the cheapest to build and the reference implementation in integral-grc, but it never uses horizontal space for the pairing this app is mostly about: a tree or a due list on one side, the item you are working on beside it. A chromeless, command-first shell — a thin top bar and a ⌘K palette doing the work of Search — was rejected because it trades recognition for recall across only four destinations, and because it makes the household's least technical use (glance at what's due, tap it) depend on a keyboard idiom.

The capsule is preferred to an edge-to-edge bottom bar because it reads as an app-level control floating over content rather than a fifth border, and it leaves the bottom corners to the content and the action button. Settings occupies the fourth slot rather than hiding behind an account menu, on the household's judgement that later features will keep adding to Settings. The counter-argument is recorded: a tab slot is spent on visit frequency, not on the size of the destination, and Settings is a route either way — so if it goes unvisited it can retreat behind an avatar without disturbing anything else.

There is no persistent title bar. The lit tab already says which destination you are in, and a strip holding only a title costs vertical space on the device with least of it. The account control went with it, so signing out lives inside Settings, alongside the theme, where it already was.

Creation has exactly one entry point per layout — the action button in compact, the sidebar button in split — and both open the same dialog: a summary, and a parent picker that decides the type. An empty parent means a Topic. There is no separate "New Topic" affordance, because a second control for the same verb would have to explain why the ladder's top rung is created differently from every other rung.

## Consequences

Lists pay bottom padding in the compact layout, because the capsule and the action button float above them. Nothing may sit permanently in the bottom centre or the bottom right of a compact screen.

Deep navigation is a stack in compact and is not one in split. Opening a child from a work item pushes another full-screen view on a phone, but replaces the detail column on a desktop, where the list column stays put. The two layouts therefore disagree about what "back" means, and only the compact one needs the word.

The breakpoint is measured in effective CSS pixels, so the type scale moves it. At a 16-pixel base an iPad in landscape measures 1035 — eleven pixels above the line. Raising the base type again would drop that device into the compact layout, which makes the type scale and the breakpoint one decision rather than two.

Labels are absent from Due tab rows and Work Items tree rows. They are filter vocabulary rather than identity, and the chips crowded the summaries, which are the thing being scanned. Labels remain on the work item detail view, on Search rows, and in Settings — the three places where they are being read or chosen rather than passed over.

The compact row is now the constrained surface. A tree row carrying status, assignee and due date leaves little width for the summary at 390 points, and summaries truncate. What a row sheds at that width is the tree's decision, not the shell's.

Whether the Work Items tree also offers contextual creation — a plus on a Project that pre-fills the parent — is left open, but the single creation dialog must remain able to reach every rung on its own.
