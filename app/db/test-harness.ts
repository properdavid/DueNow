import { openDatabaseClient } from "./client";

export function createPersistenceTestHarness() {
  return openDatabaseClient(":memory:");
}
