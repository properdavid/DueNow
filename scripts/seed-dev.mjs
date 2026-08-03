import crypto from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

if (process.env.NODE_ENV === "production") {
  console.error("The development seed script is not available in production.");
  process.exit(1);
}

const databasePath = process.env.DUENOW_DATABASE_PATH ?? "data/duenow.sqlite";
const databaseDirectory = path.dirname(databasePath);
if (databaseDirectory !== ".") {
  mkdirSync(databaseDirectory, { recursive: true });
}

const sqlite = new Database(databasePath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.function("duenow_server_timezone", () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
sqlite.function("duenow_migrated_at", () => Date.now());

const migrationsFolder = fileURLToPath(new URL("../app/db/migrations", import.meta.url));
const journal = JSON.parse(readFileSync(path.join(migrationsFolder, "meta/_journal.json"), "utf8"));
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at numeric
  )
`);
const lastMigration = sqlite
  .prepare("SELECT created_at AS createdAt FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1")
  .get();

sqlite.transaction(() => {
  for (const entry of journal.entries) {
    if (lastMigration && Number(lastMigration.createdAt) >= entry.when) {
      continue;
    }

    const migrationSql = readFileSync(path.join(migrationsFolder, `${entry.tag}.sql`), "utf8");
    for (const statement of migrationSql.split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (trimmed) {
        sqlite.exec(trimmed);
      }
    }
    sqlite
      .prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)")
      .run(crypto.createHash("sha256").update(migrationSql).digest("hex"), entry.when);
  }
})();

const now = Date.now();
const insertUser = sqlite.prepare(
  "INSERT INTO users (email, name, theme, createdAt, updatedAt) VALUES (?, ?, 'system', ?, ?) ON CONFLICT(email) DO UPDATE SET name = excluded.name, updatedAt = excluded.updatedAt RETURNING id",
);
const dana = insertUser.get("dana@example.com", "Dana", now, now).id;
const alex = insertUser.get("alex@example.com", "Alex", now, now).id;
const insertWorkItem = sqlite.prepare(`
  INSERT INTO work_items
    (type, parentId, parentType, summary, description, assigneeId, status, dueDate, createdAt, updatedAt, createdBy, updatedBy)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  RETURNING id
`);
const insertLabel = sqlite.prepare(
  "INSERT INTO labels (name, createdAt, updatedAt) VALUES (?, ?, ?) ON CONFLICT DO NOTHING RETURNING id",
);
const attachLabel = sqlite.prepare(
  "INSERT OR IGNORE INTO work_item_labels (workItemId, labelId) VALUES (?, ?)",
);

sqlite.transaction(() => {
  const household = insertWorkItem.get("topic", null, null, "House", "Shared home projects.", dana, "in_progress", null, now, now, dana, dana).id;
  const kitchen = insertWorkItem.get("project", household, "topic", "Kitchen refresh", "Paint and small fixes before guests arrive.", alex, "in_progress", "2026-08-10", now, now, dana, dana).id;
  const quotes = insertWorkItem.get("task", kitchen, "project", "Get cabinet quotes", "Ask three local shops for estimates.", alex, "open", "2026-08-05", now, now, dana, dana).id;
  insertWorkItem.run("subtask", quotes, "task", "Call first contractor", "", alex, "open", "2026-08-04", now, now, dana, dana);

  const travel = insertWorkItem.get("topic", null, null, "Travel", "Trips and logistics.", null, "open", null, now, now, dana, dana).id;
  const sanDiego = insertWorkItem.get("project", travel, "topic", "San Diego Trip", "Book the stay and plan the drive.", dana, "open", "2026-09-12", now, now, dana, dana).id;
  insertWorkItem.run("task", sanDiego, "project", "Book lodging", "Prefer a kitchen and parking.", dana, "open", "2026-08-20", now, now, dana, dana);

  const labelRow = insertLabel.get("errands", now, now) ?? sqlite.prepare("SELECT id FROM labels WHERE lower(name) = 'errands'").get();
  attachLabel.run(quotes, labelRow.id);
})();

sqlite.close();
console.log(`Seeded development Work Items in ${databasePath}`);
