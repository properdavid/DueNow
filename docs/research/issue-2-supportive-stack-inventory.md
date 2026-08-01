# Supportive stack inventory

Research for [#2](https://github.com/properdavid/DueNow/issues/2) — what the Supportive codebase (`~/Projects/Supportive`) gives DueNow to reuse, and where the seams are.

All paths below are relative to the Supportive repo root.

---

## 1. Project structure and React Router v7 conventions

**Config is minimal and fully reusable.**

`react-router.config.ts` is three lines: `{ ssr: true, appDirectory: "app" }`. SSR on, no prerendering, no custom server — production runs `react-router-serve ./build/server/index.js` (`pnpm start`).

`app/routes.ts` uses the **explicit config-based routing** API (`route(path, file)`), not file-system routing. Every route is listed by hand:

```ts
export default [
  route("/", "routes/home.tsx"),
  route("/journal", "routes/journal.tsx"),
  route("/api/journal", "routes/api.journal.tsx"),
  route("/auth/google/callback", "routes/auth.google-callback.tsx"),
  ...
] satisfies RouteConfig;
```

There is **no nested routing and no layout route**. `app/root.tsx` renders `<AppShell>` (which itself renders `<Outlet/>`) when a user is present, and a bare `<Outlet/>` when not. So the shell/auth split is done in `root.tsx` by branching on the root loader, not by route nesting.

**Directory layout — domain-module-per-folder:**

```
app/
  root.tsx  routes.ts  entry.server.tsx  app.css
  routes/          # thin: loader/action + JSX only
  auth/            # google.server.ts, session.server.ts
  db/              # index.server.ts (handle), schema.ts
  journal/         # journal.server.ts   ← one folder per bounded concept
  board/ configuration/ measurement/ progress/ retrospective/
  notifications/   # *.server.ts + push.client.ts
  components/      # app-shell.tsx, ui/* (shadcn-style Radix wrappers)
  lib/             # date, logger.server, utils (cn), presentation, use-toast
  pwa/
```

The `.server.ts` suffix marks server-only modules; `~/*` is aliased to `app/*` in `tsconfig.json`, `vite.config.ts` and `vitest.config.ts` (three places — all must agree).

**The reusable convention (this is the important one):** domain functions live in `app/<domain>/<domain>.server.ts` and **take the Drizzle `db` handle as their first argument**, so tests can drive them against an in-memory SQLite database. Routes import the singleton `db` and pass it in. From `journal.server.ts`:

```ts
export function getEntry(db: Db, userId: number, date: string): JournalEntry | undefined
```

**Reads vs writes:** reads are served by the page route's `loader`; writes go to a sibling `routes/api.<thing>.tsx` exposing only an `action`, driven from the page with `useFetcher<typeof journalAction>()`. Actions dispatch on a form field named `intent` (`"save"` / `"delete"`) and throw bare `Response`s for validation failures:

```ts
const form = await request.formData();
const intent = form.get("intent");
if (!isValidDate(date)) throw new Response("Invalid date", { status: 400 });
```

Types come from React Router's typegen: `import type { Route } from "./+types/journal"` → `Route.LoaderArgs`, `Route.ActionArgs`, `Route.ComponentProps`. `pnpm typecheck` runs `react-router typegen && tsc --noEmit`.

**Where it will not stretch to DueNow.** The flat `routes.ts` list works because Supportive has six pages and six API routes. DueNow's four tabs plus a work item detail view addressed by id (`/items/:id`) implies dynamic segments and probably a real layout route so the nav shell isn't re-decided in `root.tsx`. The `api.<thing>.tsx`-per-domain split also assumes a small, fixed set of mutation surfaces; DueNow's work item CRUD is one entity with many verbs, so an intent-dispatching `api.work-item.tsx` will get large fast — worth deciding deliberately rather than inheriting.

---

## 2. Google OAuth + email allowlist via `arctic`

Four files, ~200 lines total. **This is the highest-confidence lift-and-shift in the whole codebase** — the map has already decided DueNow does exactly this.

| File | Role |
| --- | --- |
| `app/auth/google.server.ts` | 6 lines: `new Google(clientId, clientSecret, redirectUri)` from env |
| `app/routes/auth.google.tsx` | `loader` — `generateState()` + `generateCodeVerifier()`, stashes both in httpOnly cookies (10 min), redirects to `google.createAuthorizationURL(state, verifier, ["openid","email","profile"])` |
| `app/routes/auth.google-callback.tsx` | `loader` — verifies `state` matches the cookie, `validateAuthorizationCode`, `decodeIdToken` for `{ email, name, sub }`, `getOrCreateUser`, `createSession`, sets cookie, clears the OAuth cookies, redirects `/` |
| `app/routes/auth.logout.tsx` | `action` — `destroySession` + expired cookie, redirect `/login` |

**Sessions are DB-backed, not signed cookies.** `app/auth/session.server.ts` owns the whole thing:

- `sessions` table: `id` (32 random bytes hex) → `userId`, `expiresAt`. 30-day max age.
- Cookie `sid`: `httpOnly`, `sameSite: "lax"`, `secure` only in production, `path: "/"`.
- `getUser(request)` → looks up the session, deletes it if expired, returns the user row or `null`.
- `requireUser(request)` → `throw redirect("/login")` when absent. This is the one-line guard at the top of every protected loader/action.

**The allowlist lives in an env var**, not the database:

```ts
const allowedEmails = (process.env.ALLOWED_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
if (!allowedEmails.includes(email.toLowerCase())) return null;   // → /login?error=unauthorized
```

`getOrCreateUser(email, name)` is where lazy user creation happens — checked against the allowlist first, then inserted if new. Exactly the behaviour the map's "users are created lazily on first successful sign-in" decision describes.

**`DEV_AUTH_BYPASS`** — set it to an email in non-production and `getUser` short-circuits the whole OAuth dance, auto-creating the user (still allowlist-checked). This is why local dev doesn't need Google credentials, and is worth carrying over verbatim.

**Where it will not stretch.** Supportive hardcodes a two-role model (`role: "sysadmin" | "user"`) with `SYSADMIN_EMAIL` deciding who is which, and roles drive real behaviour: the nav tabs differ per role (`getTabsForRole`), the journal is owned by "the user role" and looked up as `where(role === "user")` (see `getJournalOwnerId`). **DueNow has two symmetric household members, not an admin and a subject.** The `role` column and every `getXOwnerId(db)` helper should be dropped, and `assignee` should be a plain FK to `users`. Carrying the role model across would import an asymmetry DueNow explicitly doesn't have.

---

## 3. Drizzle + better-sqlite3

**The handle** — `app/db/index.server.ts`, module-scope singleton, ~20 lines:

```ts
const DB_PATH = process.env.DATABASE_URL || "data/supportive.db";
mkdirSync(path.dirname(DB_PATH), { recursive: true });
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
export const db = drizzle(sqlite, { schema });
migrate(db, { migrationsFolder: path.resolve(import.meta.dirname ?? ".", "../../drizzle") });
```

Note: **migrations run at module load**, synchronously, before the server accepts requests. There is no separate migrate step in the deploy — the Dockerfile just copies `drizzle/` into the production image. Simple and correct for a single-instance SQLite app; DueNow is the same shape and should keep it.

`db` is a **module-level singleton imported directly by routes** (`import { db } from "~/db/index.server"`). There is no context/DI plumbing through loaders. Testability comes entirely from domain functions taking `db` as a parameter (§1), not from swapping the singleton.

**Schema conventions** (`app/db/schema.ts`, single file, ~270 lines, all tables):

- `integer("id").primaryKey({ autoIncrement: true })` — integer surrogate keys everywhere, no UUIDs.
- Timestamps: `integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date())`.
- Booleans: `integer("x", { mode: "boolean" })`.
- Enums: `text("state", { enum: ["met", "not_met", "na"] })` — typed at the TS level, **not** a DB CHECK constraint.
- Calendar dates are `text("date")` holding `YYYY-MM-DD`, deliberately not timestamps.
- Uniqueness via the array-form third argument: `(t) => [uniqueIndex("..._unique").on(t.a, t.b)]`.
- Every table carries a prose comment tying it to an ADR and stating what a row *means* — including what the absence of a row means. This is the convention most worth carrying into DueNow, given the map's emphasis on domain modelling.

**Migration workflow:** `pnpm db:generate` (drizzle-kit diffs `schema.ts` → new `drizzle/NNNN_name.sql` + `meta/` snapshot), `pnpm db:migrate` to apply out-of-band. Migrations are committed. `drizzle.config.ts` points at `./app/db/schema.ts`, out `./drizzle`, dialect `sqlite`. Nine migrations exist; at least one (`0007`) was **hand-edited** to do a table-recreate data migration, and got its own test (`tests/migration.test.ts`) that builds the legacy table, applies the raw SQL by splitting on `--> statement-breakpoint`, and asserts rows survived.

**Where it will not stretch.** Supportive's tables are flat — no self-referencing FKs, no recursive reads. DueNow's four-level type ladder (Topic → … ) is a self-referential `parentId` tree, which SQLite handles fine via recursive CTEs but Drizzle's query builder does not express well; expect at least one raw `sql` template for subtree queries. Nothing here shows how Supportive would do that, because it never had to. Also: no indexes beyond unique constraints exist, and the Due tab's date-window queries will want a real index on due date.

---

## 4. PWA configuration

`vite-plugin-pwa` in `vite.config.ts`, with deliberate, well-commented choices:

- `registerType: "prompt"` + `injectRegister: null` — **no auto-update**. The app surfaces its own banner (`app/pwa/UpdateBanner.tsx`) and the waiting worker only activates when the user accepts.
- `workbox.globPatterns: ["**/*.{js,css,svg,png,ico,woff2}"]` — **precaches static assets only**.
- `workbox.navigateFallback: null` — the comment is explicit: *"SSR renders per-request, authenticated HTML; never serve it (or the API) from cache."*
- `importScripts: ["/push-sw.js"]` — hand-written Web Push handlers merged into the generated SW.
- `define: { __APP_VERSION__ }` from `APP_VERSION` env → git short SHA → timestamp fallback (`app/pwa/build-version.ts`), giving a stable per-build id so identical rebuilds don't re-nag.

`app/pwa/update-banner.ts` is pure logic over a minimal `VersionStore` interface (`getItem`/`setItem`/`removeItem`) precisely so it is unit-testable without a DOM — a good pattern, and `tests/pwa.test.ts` has 21 cases against it.

**Device-class assumptions.** The manifest is `display: "standalone"`, two PNG icons (192/512) plus a maskable and an SVG, and `app/root.tsx` adds the Apple set (`apple-touch-icon`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`, status bar style). **This is a phone-installable configuration.** The offline story is: static shell cached, all real content requires the network. That is *not* offline capability — it is fast repeat loads.

**Where it will not stretch.** Nothing here is device-class-aware, and the map has ruled that DueNow treats phone, tablet, and desktop as equally first-class. The `navigateFallback: null` decision means an offline DueNow shows nothing useful at all, on any device — the map's open "offline and PWA expectations per device class" fog is genuinely unanswered by Supportive, which simply never asked the question.

---

## 5. Testing

`vitest.config.ts` is minimal: `globals: true`, `environment: "node"`, the `~` alias. **No jsdom, no Testing Library.** `react-test-renderer` is a devDependency and is used in the two `.tsx` tests. `pnpm test` = `vitest run`.

19 test files, ~370 cases. The distribution tells the story:

| Layer | Coverage |
| --- | --- |
| Domain `.server.ts` modules | Heavy — `measurement` 65, `configuration` 62, `board` 50, `notifications` 46, `retrospective` 23 |
| Pure `lib/` helpers | `date` 12, `presentation` 3, `board-state` (optimistic UI) 5 |
| PWA/update logic | 21 |
| Migrations | 3 (the hand-written `0007` data migration) |
| Auth | **4** — only `getOrCreateUser` allowlist behaviour and cookie serialization |
| Routes / components | **~10 total**, and shallow: `getTabsForRole` returns the right list; `ui-primitives` and `toast-system` assert variant class strings; one `configuration-route.test.tsx` |

**The pattern to copy** — `tests/db.test.ts` and every domain test build a fresh DB per test:

```ts
const sqlite = new Database(":memory:");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });
migrate(db, { migrationsFolder: path.resolve(import.meta.dirname!, "../drizzle") });
```

Running the **real committed migrations** against `:memory:` means the tests also continuously prove the migration chain applies cleanly from zero. Combined with the `db`-as-first-argument convention, this gives fast, honest tests with no mocking. Carry both.

**What is essentially untested:** loaders and actions (no request-level tests), rendered UI behaviour, and the OAuth callback flow end-to-end. If DueNow wants confidence in the tab views, it needs a testing layer Supportive doesn't have — likely jsdom + Testing Library, which is a real addition, not a carry-over.

---

## 6. Also present, and reusable

- **Tailwind v4** via `@tailwindcss/vite` — no `tailwind.config.js` at all. `app/app.css` uses `@import "tailwindcss"` and `@theme inline { --color-primary: hsl(var(--primary)); ... }` to bridge CSS variables to utility classes, with `:root` / `.dark` blocks holding raw HSL triples. Semantic token set (`background/foreground/primary/secondary/muted/accent/card/popover/border/input/ring` + `success/warning/info/destructive` each with `-foreground` and `-subtle`) and a `--radius-*` scale. **This token architecture is directly reusable.**
- **shadcn-style Radix wrappers** in `app/components/ui/` — `button`, `card`, `checkbox`, `dialog`, `input`, `select`, `textarea`, `toast`, `toaster`. Standard `cva` + `cn` (clsx + tailwind-merge) construction. Eight components; DueNow will need more (tree/disclosure, date picker, combobox for search).
- **`lib/logger.server.ts`** — pino, with pino-pretty in dev.
- **Dockerfile** — two-stage node:22-slim + pnpm via corepack, `VOLUME ["/app/data"]` for the SQLite file, `CMD ["pnpm","start"]`. Needs `--build-arg APP_VERSION` because the build context excludes `.git`.
- **CI** (`.github/workflows/ci.yml`) — on PRs to `main`: checkout, node 20, pnpm, `--frozen-lockfile`, `pnpm typecheck`, `pnpm test`. No lint step; there is no ESLint/Prettier in the repo at all. (Note the node 20 in CI vs `engines: >=22` and node:22 in Docker — an inconsistency, don't copy it.)
- **`.env.example`** as the env contract.
- **Repo doc conventions** — `CONTEXT.md`, `docs/adr/NNNN-*.md`, `docs/agents/*`, `docs/research/`, `prototype/*/NOTES.md`. DueNow already inherits the `docs/agents/` half.

---

## 7. Do **not** carry over

| Thing | Why |
| --- | --- |
| `role: "sysadmin" \| "user"` and `SYSADMIN_EMAIL` | Supportive's two users are asymmetric (an admin and a subject); DueNow's two are peers. It leaks into nav, ownership checks, and every `getXOwnerId(db)` helper. |
| `getTabsForRole` | Same reason — DueNow's tabs are the same for both members. |
| Everything under `app/notifications/` + `node-cron` + `web-push` + `public/push-sw.js` + VAPID env | Push is explicitly v2 on the map. The in-process cron scheduler booted from `entry.server.tsx` is also a pattern to re-derive later, not inherit. |
| `America/Los_Angeles` hardcoded in `lib/date.ts` | The `YYYY-MM-DD`-as-text and UTC-arithmetic-for-day-math techniques are worth keeping; the pinned constant is a Supportive product decision. DueNow should decide its own timezone story before copying. |
| The KPI/measurement/board/retrospective domain modules | Supportive's product, not a framework. |
| `startReminderScheduler()` called from `entry.server.tsx` | Side effect at SSR-entry module load; only justified by the cron job, which isn't coming. |
| CI's `node-version: 20` | Contradicts `engines: >=22` and the node:22 Docker base. |

## 8. Gaps DueNow must solve for itself

Supportive is a small, mostly-flat, phone-first, two-page-shaped app. Everything below is a DueNow requirement with **no precedent in Supportive**:

1. **Self-referencing hierarchy** — the four-level type ladder, subtree reads, cascade rules. No recursive query anywhere in Supportive.
2. **Responsive navigation shell** — Supportive's `app-shell.tsx` is a fixed 14px-tall header plus a floating capsule tab bar, hardcoded, with no breakpoints and no desktop treatment. It answers "what does the phone look like" and nothing else. This is exactly why the map has a second inventory ticket pointed at integral-grc.
3. **Search** — no search of any kind exists; no FTS5, no `LIKE` queries, no search UI.
4. **A detail view addressed by id** — every Supportive route is a singleton page; there are no dynamic route segments at all.
5. **Route/component-level testing** — the harness for this doesn't exist.
6. **Meaningful offline behaviour** — deliberately excluded by `navigateFallback: null`.
