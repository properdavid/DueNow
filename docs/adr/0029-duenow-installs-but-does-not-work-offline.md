# DueNow installs but does not work offline

DueNow ships a manifest and a service worker on every device class, and the only thing they buy is **installation**. The worker precaches the static shell — JS, CSS, icons, fonts — and nothing else. No screen renders from cache, no write is queued, and when the server cannot be reached the app says so and offers Retry.

Every screen is per-request authenticated SSR of *derived* state. The Due tab is computed against Today in the household timezone (ADR-0008) and the Covering rule runs over the visible set (ADR-0009); a cached page is a radar computed at a stale Today, wrong in exactly the way ADR-0024 refused to accept when it declined to hardcode UTC. A cached tree shows an item Open that your partner completed and cascaded an hour ago, with nothing on screen to say which you are looking at. For two people reaching a self-hosted box over home wifi or phone data, stale-but-silent is a worse failure than absent-and-loud.

Installation is still worth the config. Standalone mode removes the browser chrome that otherwise sits exactly where ADR-0017 puts the Compact Layout's floating capsule, an installed window is what makes a self-hosted household app feel like an app rather than a tab, and Chromium requires a fetch-handling service worker for the install prompt regardless — so the worker exists either way. Its precache makes repeat loads fast, which is the whole of the offline story.

**One vocabulary, three surfaces, and it names a symptom rather than a cause.** A cold launch with no server gets a precached screen; a navigation whose loader fails gets a retry state in the error boundary; a write that fails gets an inline message beside the control. All three say **Can't reach DueNow**, never "You're offline" — DueNow is one self-hosted box, so "the server is off" is at least as likely as "you are in a lift", and the app cannot tell the two apart.

**A failed write fails in place.** Network failure is presented in ADR-0022's expected-failure shape, not thrown: an unhandled rejection from a `useFetcher` would bubble to the route error boundary, so a three-second blip would tear down the Detail View and take a half-written comment with it. The ✓/✕ editor keeps its text, a Property Chip snaps back to its prior value. Nothing was optimistic (ADR-0022), so there is nothing to reconcile — the UI simply never advanced.

## Considered options

**An offline read cache** (stale-while-revalidate on HTML) is what a read-mostly reference app would do. DueNow is a shared mutable tree where staleness is indistinguishable from truth, and it would also put authenticated HTML in a cache that outlives sign-out.

**An outbox that queues writes** was rejected on ADR-0022's own reasoning. That ADR refused to send descendant ids with a settle so the server could recompute the sweep at the moment of the write, accepting a sub-second race as the price. A queue stretches that race to hours, and the work it then sweeps unnamed is work the household may already have dealt with. Consent you cannot see is not consent — the same objection that kept settling out of the Work Items Tree and out of Search.

**A connectivity banner** driven by `navigator.onLine` answers the wrong question: it reports the device's link, not whether the one box serving this household is up. It would claim everything is fine while nothing loads. A claim the app cannot actually make does not go on screen.

**`registerType: "autoUpdate"`** reloads the page under you when a new build lands. ADR-0019 made blur commit nothing, so uncommitted text behind a ✓ is the designed state of the editor, and a background reload eats it. Supportive's prompt-and-banner is lifted whole instead — `injectRegister: null`, a stable `__APP_VERSION__` build id so identical rebuilds do not re-nag, and its pure `update-banner.ts` over a `VersionStore`. Only `importScripts: ["/push-sw.js"]` is dropped, v1 having no push.

**`display: "window-controls-overlay"`** on desktop hands back the titlebar strip to draw into, but ADR-0017 decided DueNow has no title bar; taking it would mean inventing one to fill space the OS gave back.

## Consequences

The manifest is Supportive's with three edits: `display: "standalone"` on all three device classes, **no `orientation` lock** — pinning it would disable ADR-0017's rotation rule, where a tablet in landscape earns the Split Layout — and `theme_color` set to ADR-0014's indigo primary (`#4d41c8`). `scope` and `start_url` stay `/`, which ADR-0024 already fixed on the Due tab. Icons stay 192/512/maskable/SVG plus the Apple set; manifest `screenshots` are skipped, dressing only Android's install sheet.

The document's `theme-color` meta is **rendered server-side from the user's theme column** — an explicit Light or Dark choice emits one value, System emits the `prefers-color-scheme` media pair. ADR-0015 stands: nothing reads the theme from JS.

The precached screen is `public/offline.html`: hand-written, self-contained, no hashed bundle. It is **exempt from `design-lint`** as prototypes are (ADR-0014), and deliberately monochrome so there is nothing to drift. It honours `prefers-color-scheme` in plain CSS but cannot know an explicit theme choice, which lives in the database it cannot reach.

Navigations are served `NetworkOnly` with a `precacheFallback`, so the fallback fires on network failure alone — a 500 is a real response and reaches the server's own error page.

Installing is what makes `env(safe-area-inset-bottom)` real, so ADR-0017's floating capsule must clear it in standalone.

You cannot jot a comment with no connection. For a two-person household reaching a box on its own network, that is the accepted cost of not turning a shared to-do list into a distributed-systems problem.
