import { describe, expect, test } from "vitest";

import { createPersistenceTestHarness } from "~/db/test-harness";
import { searchWorkItems } from "./work-items.server";

function seedUser(database: ReturnType<typeof createPersistenceTestHarness>) {
  return database.sqlite
    .prepare("INSERT INTO users (googleSubject, email, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?) RETURNING id")
    .get("dana", "dana@example.com", "Dana", 1, 1) as { id: number };
}

describe("Work Item search query seam", () => {
  test("Keyword matches word prefixes in Summary and Description, never Comments, and cannot throw on syntax", () => {
    const database = createPersistenceTestHarness();
    try {
      const user = seedUser(database);
      const insert = database.sqlite.prepare(
        "INSERT INTO work_items (id, type, parentId, parentType, summary, description, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      );
      insert.run(1, "topic", null, null, "Get patio cover quotes", "", "open", 1, 1, user.id, user.id);
      insert.run(2, "topic", null, null, "Fence", "Call Sam OR Alex about clean-up", "open", 1, 1, user.id, user.id);
      insert.run(3, "topic", null, null, "Writing", "quoting examples", "open", 1, 1, user.id, user.id);
      insert.run(4, "topic", null, null, "Comment-only", "", "open", 1, 1, user.id, user.id);
      database.sqlite.prepare("INSERT INTO comments (workItemId, authorId, body, createdAt, edited) VALUES (?, ?, ?, ?, 0)").run(4, user.id, "patio", 1);

      expect(searchWorkItems(database, { keyword: "patio quo" }).rows.map((row) => row.id)).toEqual([1]);
      expect(searchWorkItems(database, { keyword: "quote" }).rows.map((row) => row.id)).toEqual([1]);
      expect(searchWorkItems(database, { keyword: "quoting" }).rows.map((row) => row.id)).toEqual([3]);
      expect(searchWorkItems(database, { keyword: "Sam OR Alex" }).rows.map((row) => row.id)).toEqual([2]);
      expect(searchWorkItems(database, { keyword: `patio "cover` }).rows.map((row) => row.id)).toEqual([1]);
      expect(searchWorkItems(database, { keyword: "clean-up" }).rows.map((row) => row.id)).toEqual([2]);
    } finally {
      database.close();
    }
  });

  test("raw work_items writes maintain and can rebuild the external-content FTS index", () => {
    const database = createPersistenceTestHarness();
    try {
      const user = seedUser(database);
      const ftsSql = database.sqlite.prepare("SELECT sql FROM sqlite_master WHERE name = 'work_items_fts'").get() as { sql: string };
      expect(ftsSql.sql).toContain("content='work_items'");
      expect(ftsSql.sql).toContain("tokenize='unicode61 remove_diacritics 2'");
      expect(ftsSql.sql).toContain("prefix='2 3'");
      database.sqlite
        .prepare(
          "INSERT INTO work_items (id, type, parentId, parentType, summary, description, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .run(1, "topic", null, null, "Patio", "cover quotes", "open", 1, 1, user.id, user.id);

      expect(searchWorkItems(database, { keyword: "patio" }).rows.map((row) => row.id)).toEqual([1]);

      database.sqlite.prepare("UPDATE work_items SET summary = ?, description = ? WHERE id = ?").run("Fence", "gate latch", 1);
      expect(searchWorkItems(database, { keyword: "patio" }).rows).toEqual([]);
      expect(searchWorkItems(database, { keyword: "latch" }).rows.map((row) => row.id)).toEqual([1]);

      database.sqlite.prepare("DELETE FROM work_items WHERE id = ?").run(1);
      expect(searchWorkItems(database, { keyword: "latch" }).rows).toEqual([]);

      database.sqlite
        .prepare(
          "INSERT INTO work_items (id, type, parentId, parentType, summary, description, status, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .run(2, "topic", null, null, "Kitchen", "cabinet paint", "open", 1, 1, user.id, user.id);
      database.sqlite.prepare("INSERT INTO work_items_fts(work_items_fts) VALUES('rebuild')").run();
      expect(searchWorkItems(database, { keyword: "cab paint" }).rows.map((row) => row.id)).toEqual([2]);
    } finally {
      database.close();
    }
  });

  test("filters AND across controls, OR within controls, sort with last-place nulls, and report the capped total", () => {
    const database = createPersistenceTestHarness();
    try {
      const dana = seedUser(database);
      const lee = database.sqlite
        .prepare("INSERT INTO users (googleSubject, email, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?) RETURNING id")
        .get("lee", "lee@example.com", "Lee", 1, 1) as { id: number };
      database.sqlite.prepare("UPDATE household_settings SET timezone = ? WHERE id = 1").run("America/Los_Angeles");
      const label = database.sqlite.prepare("INSERT INTO labels (name, createdAt, updatedAt) VALUES (?, ?, ?) RETURNING id").get("House", 1, 1) as { id: number };
      const insert = database.sqlite.prepare(
        "INSERT INTO work_items (id, type, parentId, parentType, summary, description, assigneeId, status, dueDate, createdAt, updatedAt, createdBy, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      );
      insert.run(1, "topic", null, null, "House", "", dana.id, "open", "2026-08-01", 1, 10, dana.id, dana.id);
      insert.run(2, "project", 1, "topic", "Kitchen", "paint cabinets", null, "in_progress", "2026-08-02", 1, 20, dana.id, dana.id);
      insert.run(3, "project", 1, "topic", "Patio", "paint cover", lee.id, "completed", null, 1, 30, dana.id, dana.id);
      insert.run(4, "task", 2, "project", "Prime cabinets", "paint primer", null, "open", "2026-08-03", 1, 40, dana.id, dana.id);
      database.sqlite.prepare("INSERT INTO work_item_labels (workItemId, labelId) VALUES (?, ?)").run(2, label.id);
      database.sqlite.prepare("INSERT INTO work_item_labels (workItemId, labelId) VALUES (?, ?)").run(4, label.id);

      expect(
        searchWorkItems(database, {
          keyword: "paint",
          types: ["project", "task"],
          statuses: ["open", "in_progress"],
          assigneeIds: [null],
          parentIds: [1, 2],
          labelIds: [label.id],
          due: { mode: "between", start: "2026-08-01", end: "2026-08-03" },
          sort: "status",
          direction: "desc",
          now: new Date("2026-08-03T12:00:00.000Z"),
        }).rows.map((row) => row.id),
      ).toEqual([2, 4]);

      expect(searchWorkItems(database, { due: { mode: "overdue" }, now: new Date("2026-08-03T12:00:00.000Z") }).rows.map((row) => row.id)).toEqual([1, 2]);
      expect(searchWorkItems(database, { due: { mode: "before", date: "2026-08-02" } }).rows.map((row) => row.id)).toEqual([1]);
      expect(searchWorkItems(database, { due: { mode: "after", date: "2026-08-02" } }).rows.map((row) => row.id)).toEqual([4]);
      expect(searchWorkItems(database, { due: { mode: "none" } }).rows.map((row) => row.id)).toEqual([3]);

      const sortedByParent = searchWorkItems(database, { sort: "parent", direction: "desc" }).rows.map((row) => row.id);
      expect(sortedByParent).toEqual([4, 2, 3, 1]);
      expect(searchWorkItems(database, { sort: "type", direction: "desc" }).rows.map((row) => row.id)).toEqual([4, 2, 3, 1]);

      for (let id = 5; id <= 205; id += 1) {
        insert.run(id, "topic", null, null, `Bulk ${id}`, "", null, "open", null, 1, id, dana.id, dana.id);
      }
      const capped = searchWorkItems(database, { sort: "id", direction: "asc" });
      expect(capped.resultCount).toBe(205);
      expect(capped.rows).toHaveLength(200);
      expect(capped.rows.at(-1)?.id).toBe(200);
    } finally {
      database.close();
    }
  });
});
