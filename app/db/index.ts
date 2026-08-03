import { createDatabaseClient } from "./client";

export const database = createDatabaseClient();
export const db = database.db;
export const sqlite = database.sqlite;
