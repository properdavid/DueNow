import { createDatabaseClient } from "./client";
import type { DatabaseClient } from "./client";

let database: DatabaseClient | null = null;

export function getDefaultDatabase() {
  database ??= createDatabaseClient();
  return database;
}
