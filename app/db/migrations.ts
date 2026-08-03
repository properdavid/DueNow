import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

export const migrationsFolder = fileURLToPath(new URL("./migrations", import.meta.url));

function migrationFiles() {
  return readdirSync(migrationsFolder)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();
}

export function readCommittedMigrationSql() {
  return migrationFiles()
    .map((fileName) => readFileSync(path.join(migrationsFolder, fileName), "utf8"))
    .join("\n");
}

export function resolveServerTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function applyMigrations(sqlite: Database.Database, db: BetterSQLite3Database<Record<string, unknown>>) {
  const migratedAt = Date.now();
  sqlite.function("duenow_server_timezone", () => resolveServerTimezone());
  sqlite.function("duenow_migrated_at", () => migratedAt);
  migrate(db, { migrationsFolder });
}
