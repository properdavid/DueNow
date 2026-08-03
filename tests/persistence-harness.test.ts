import { afterEach, describe, expect, test, vi } from "vitest";

import { createPersistenceTestHarness } from "~/db/test-harness";
import { readCommittedMigrationSql } from "~/db/migrations";

const fixedInstant = 1_725_235_200_000;
type TestSqlite = ReturnType<typeof createPersistenceTestHarness>["sqlite"];

function insertUser(sqlite: TestSqlite) {
  sqlite
    .prepare(
      "INSERT INTO users (googleSubject, email, name, theme, createdAt, updatedAt) VALUES (?, ?, ?, 'system', ?, ?)",
    )
    .run("google-subject-dana", "dana@example.com", "Dana", fixedInstant, fixedInstant);
  return sqlite.prepare("SELECT id FROM users WHERE email = ?").get("dana@example.com") as { id: number };
}

interface InsertWorkItemInput {
  type: "topic" | "project" | "task" | "subtask";
  summary: string;
  createdBy: number;
  parentId?: number | null;
  parentType?: "topic" | "project" | "task" | null;
  description?: string;
  assigneeId?: number | null;
  status?: "open" | "in_progress" | "completed" | "closed";
  dueDate?: string | null;
}

function insertWorkItem(sqlite: TestSqlite, input: InsertWorkItemInput) {
  sqlite
    .prepare(
      `INSERT INTO work_items
        (type, parentId, parentType, summary, description, assigneeId, status, dueDate, createdAt, updatedAt, createdBy, updatedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.type,
      input.parentId ?? null,
      input.parentType ?? null,
      input.summary,
      input.description ?? "",
      input.assigneeId ?? null,
      input.status ?? "open",
      input.dueDate ?? null,
      fixedInstant,
      fixedInstant,
      input.createdBy,
      input.createdBy,
    );

  return sqlite.prepare("SELECT id FROM work_items WHERE summary = ?").get(input.summary) as {
    id: number;
  };
}

describe("the persistence test harness", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("builds an in-memory database from the committed migrations", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    const harness = createPersistenceTestHarness();

    try {
      expect(harness.sqlite.memory).toBe(true);
      expect(harness.sqlite.pragma("foreign_keys", { simple: true })).toBe(1);
      expect(harness.sqlite.prepare("SELECT COUNT(*) AS count FROM work_items").get()).toEqual({ count: 0 });
      expect(harness.sqlite.prepare("SELECT COUNT(*) AS count FROM labels").get()).toEqual({ count: 0 });
      expect(harness.sqlite.prepare("SELECT COUNT(*) AS count FROM users").get()).toEqual({ count: 0 });
      expect(harness.sqlite.prepare("SELECT timezone FROM household_settings").get()).toEqual({
        timezone: "America/Los_Angeles",
      });
      expect(() =>
        harness.sqlite.prepare("INSERT INTO household_settings (id, timezone) VALUES (2, 'UTC')").run(),
      ).toThrow();
    } finally {
      harness.close();
    }
  });

  test("rejects Work Item parentage outside the Type Ladder", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    const harness = createPersistenceTestHarness();

    try {
      const user = insertUser(harness.sqlite);
      const topic = insertWorkItem(harness.sqlite, {
        type: "topic",
        summary: "House",
        createdBy: user.id,
      });

      expect(() =>
        insertWorkItem(harness.sqlite, {
          type: "subtask",
          parentId: topic.id,
          parentType: "topic",
          summary: "Call contractor",
          createdBy: user.id,
        }),
      ).toThrow();

      expect(() =>
        insertWorkItem(harness.sqlite, {
          type: "project",
          parentId: topic.id,
          parentType: "project",
          summary: "Patio cover",
          createdBy: user.id,
        }),
      ).toThrow();
    } finally {
      harness.close();
    }
  });

  test("rejects a Topic with a parent and a non-Topic without one", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    const harness = createPersistenceTestHarness();

    try {
      const user = insertUser(harness.sqlite);
      const topic = insertWorkItem(harness.sqlite, {
        type: "topic",
        summary: "Travel",
        createdBy: user.id,
      });

      expect(() =>
        insertWorkItem(harness.sqlite, {
          type: "topic",
          parentId: topic.id,
          summary: "San Diego",
          createdBy: user.id,
        }),
      ).toThrow();

      expect(() =>
        insertWorkItem(harness.sqlite, {
          type: "project",
          summary: "San Diego Trip",
          createdBy: user.id,
        }),
      ).toThrow();
    } finally {
      harness.close();
    }
  });

  test("keeps Work Item-owned rows and peer Work Items on their intended delete rules", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    const harness = createPersistenceTestHarness();

    try {
      const user = insertUser(harness.sqlite);
      const topic = insertWorkItem(harness.sqlite, {
        type: "topic",
        summary: "Celebrations",
        dueDate: "2026-09-01",
        createdBy: user.id,
      });
      harness.sqlite
        .prepare("INSERT INTO labels (name, createdAt, updatedAt) VALUES ('party', ?, ?)")
        .run(fixedInstant, fixedInstant);
      const label = harness.sqlite.prepare("SELECT id FROM labels WHERE name = 'party'").get() as {
        id: number;
      };
      harness.sqlite
        .prepare("INSERT INTO work_item_labels (workItemId, labelId) VALUES (?, ?)")
        .run(topic.id, label.id);
      harness.sqlite
        .prepare(
          "INSERT INTO comments (workItemId, authorId, body, createdAt) VALUES (?, ?, 'Bring balloons', ?)",
        )
        .run(topic.id, user.id, fixedInstant);

      harness.sqlite.prepare("DELETE FROM work_items WHERE id = ?").run(topic.id);

      expect(harness.sqlite.prepare("SELECT COUNT(*) AS count FROM work_item_labels").get()).toEqual({
        count: 0,
      });
      expect(harness.sqlite.prepare("SELECT COUNT(*) AS count FROM comments").get()).toEqual({ count: 0 });

      const labelledTopic = insertWorkItem(harness.sqlite, {
        type: "topic",
        summary: "Travel",
        createdBy: user.id,
      });
      harness.sqlite
        .prepare("INSERT INTO work_item_labels (workItemId, labelId) VALUES (?, ?)")
        .run(labelledTopic.id, label.id);
      harness.sqlite.prepare("DELETE FROM labels WHERE id = ?").run(label.id);
      expect(harness.sqlite.prepare("SELECT COUNT(*) AS count FROM work_item_labels").get()).toEqual({
        count: 0,
      });

      const parent = insertWorkItem(harness.sqlite, {
        type: "topic",
        summary: "House",
        createdBy: user.id,
      });
      insertWorkItem(harness.sqlite, {
        type: "project",
        parentId: parent.id,
        parentType: "topic",
        summary: "Kitchen",
        createdBy: user.id,
      });

      expect(() => harness.sqlite.prepare("DELETE FROM work_items WHERE id = ?").run(parent.id)).toThrow();
    } finally {
      harness.close();
    }
  });

  test("commits comments and indexes without forbidden columns", () => {
    const migrationSql = readCommittedMigrationSql();

    expect(migrationSql).toContain("no app-level delete exists; this is a backstop against bugs");
    for (const tableName of [
      "users",
      "sessions",
      "labels",
      "work_item_labels",
      "comments",
      "household_settings",
      "work_items",
      "work_items_fts",
    ]) {
      expect(migrationSql).toContain(`TABLE COMMENT: ${tableName}`);
    }
    expect(migrationSql).toContain("idx_work_items_due_date");
    expect(migrationSql).toContain("idx_work_items_parentage");
    expect(migrationSql).not.toMatch(/\b(depth|position|completedAt|deletedAt|deleted_at|softDelete|soft_delete|materializedPath|materialisedPath|closure)\b/);
  });

  test("keeps the Keyword index in step with Work Item writes", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    const harness = createPersistenceTestHarness();

    try {
      const user = insertUser(harness.sqlite);
      insertWorkItem(harness.sqlite, {
        type: "topic",
        summary: "Patio quotes",
        description: "Compare contractor estimates",
        createdBy: user.id,
      });

      expect(
        harness.sqlite
          .prepare("SELECT rowid FROM work_items_fts WHERE work_items_fts MATCH 'patio'")
          .all(),
      ).toHaveLength(1);

      harness.sqlite.prepare("UPDATE work_items SET summary = 'Kitchen paint'").run();

      expect(
        harness.sqlite
          .prepare("SELECT rowid FROM work_items_fts WHERE work_items_fts MATCH 'patio'")
          .all(),
      ).toHaveLength(0);
      expect(
        harness.sqlite
          .prepare("SELECT rowid FROM work_items_fts WHERE work_items_fts MATCH 'kitchen'")
          .all(),
      ).toHaveLength(1);

      harness.sqlite.prepare("INSERT INTO work_items_fts(work_items_fts) VALUES('rebuild')").run();

      expect(
        harness.sqlite
          .prepare("SELECT rowid FROM work_items_fts WHERE work_items_fts MATCH 'kitchen'")
          .all(),
      ).toHaveLength(1);

      harness.sqlite.prepare("DELETE FROM work_items").run();

      expect(
        harness.sqlite
          .prepare("SELECT rowid FROM work_items_fts WHERE work_items_fts MATCH 'kitchen'")
          .all(),
      ).toHaveLength(0);
    } finally {
      harness.close();
    }
  });
});
