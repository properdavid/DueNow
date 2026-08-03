# DueNow

Household project management for a two-person household. React Router 7 (SSR) + SQLite. See `CONTEXT.md` for the domain, `DESIGN.md` for the UI.

## Local development

Requires Node >= 22.

```bash
npm install
npm run seed:dev   # optional sample data
npm run dev        # http://localhost:5173
```

Migrations run automatically on startup; the SQLite file is created if missing.

In dev, `/login` offers a password-free sign-in that skips Google OAuth (disabled when `NODE_ENV=production`).

Other scripts:

```bash
npm test           # vitest
npm run typecheck  # react-router typegen + tsc
npm run design-lint
npm run db:generate  # drizzle migration after editing app/db/schema.ts
```

## Build

```bash
npm run build   # -> build/
npm start       # serves build/server/index.js on PORT (default 3000)
```

Deploy `build/`, `package.json`, and production `node_modules` (`better-sqlite3` is native — install on the target platform). Mount a persistent volume for `DUENOW_DATABASE_PATH`.

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DUENOW_DATABASE_PATH` | no | `data/duenow.sqlite` | SQLite file location |
| `DUENOW_ALLOWED_EMAILS` | yes | — | Comma-separated allowlist; anyone else is refused |
| `GOOGLE_CLIENT_ID` | prod | — | Google OAuth client |
| `GOOGLE_CLIENT_SECRET` | prod | — | Google OAuth client |
| `GOOGLE_REDIRECT_URI` | prod | — | Must match `<origin>/auth/google/callback` |
| `DUENOW_DEV_AUTH_EMAIL` | no | first allowed email | Dev sign-in identity |
| `DUENOW_DEV_AUTH_NAME` | no | email local part | Dev sign-in display name |
| `DUENOW_APP_VERSION` | no | git describe | Version baked into the build |
| `NODE_ENV` | no | per command | `production` enables secure cookies, disables dev sign-in and seeding |
| `PORT` | no | `3000` | Production server port |

There is no dotenv loader: variables must be in the process environment. Locally, keep them in `.env` (gitignored) and run e.g. `set -a; . ./.env; set +a; npm run dev`.
