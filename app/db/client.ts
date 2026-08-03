import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { applyMigrations } from "./migrations";
import { schema } from "./schema";

interface DatabaseClientOptions {
  journalMode?: "wal" | "memory";
}

export function openDatabaseClient(databasePath: string, options: DatabaseClientOptions = {}) {
  if (databasePath !== ":memory:") {
    const databaseDirectory = path.dirname(databasePath);
    if (databaseDirectory !== ".") {
      mkdirSync(databaseDirectory, { recursive: true });
    }
  }

  const sqlite = new Database(databasePath);
  if (options.journalMode === "wal") {
    sqlite.pragma("journal_mode = WAL");
  }
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  applyMigrations(sqlite, db);

  return {
    sqlite,
    db,
    close: () => sqlite.close(),
  };
}

export function createDatabaseClient(databasePath = process.env.DUENOW_DATABASE_PATH ?? "data/duenow.sqlite") {
  return openDatabaseClient(databasePath, { journalMode: "wal" });
}
