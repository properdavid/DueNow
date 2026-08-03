-- TABLE COMMENT: users — ADR-0004 and ADR-0024. A row means a household member has signed in successfully at least once; no row means the allowlisted person has not signed in yet. Users are created lazily, have no roles, and are never deleted.
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL COLLATE NOCASE,
  name TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  UNIQUE (email)
);
--> statement-breakpoint
-- TABLE COMMENT: sessions — ADR-0004. A row means a browser has a live signed-in session; no row means the cookie is absent, expired, signed out, or otherwise not usable.
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX idx_sessions_user ON sessions(userId);
--> statement-breakpoint
CREATE INDEX idx_sessions_expires ON sessions(expiresAt);
--> statement-breakpoint
-- TABLE COMMENT: labels — ADR-0006, ADR-0018, and ADR-0024. A row means the household has chosen one managed Label name; no row means no Label with that spelling exists. A Label carries no colour.
CREATE TABLE labels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK (name = trim(name) AND length(name) BETWEEN 1 AND 30),
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX idx_labels_name_ci ON labels(lower(name));
--> statement-breakpoint
-- TABLE COMMENT: household_settings — ADR-0001, ADR-0008, and ADR-0024. The single row means the Household Timezone has a value for computing Today; a missing row means the migration chain did not finish and the app cannot compute due-date groups.
CREATE TABLE household_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  timezone TEXT NOT NULL CHECK (length(trim(timezone)) > 0),
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
--> statement-breakpoint
INSERT INTO household_settings (id, timezone, createdAt, updatedAt)
VALUES (1, duenow_server_timezone(), duenow_migrated_at(), duenow_migrated_at());
--> statement-breakpoint
-- TABLE COMMENT: work_items — ADR-0002, ADR-0006, ADR-0007, ADR-0010, ADR-0013, and ADR-0025. A row is one Work Item in the Type Ladder; no row means that Work Item does not exist, and on a fresh deployment there are none.
CREATE TABLE work_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('topic', 'project', 'task', 'subtask')),
  parentId INTEGER,
  parentType TEXT,
  summary TEXT NOT NULL CHECK (summary = trim(summary) AND length(summary) BETWEEN 1 AND 200),
  description TEXT NOT NULL DEFAULT '' CHECK (length(trim(description)) <= 20000),
  assigneeId INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'closed')),
  dueDate TEXT CHECK (dueDate IS NULL OR dueDate GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  createdBy INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updatedBy INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE (id, type),
  -- Parentage is RESTRICT because no app-level delete exists; this is a backstop against bugs.
  FOREIGN KEY (parentId, parentType) REFERENCES work_items(id, type) ON DELETE RESTRICT,
  CHECK (
    (type = 'topic' AND parentType IS NULL) OR
    (type = 'project' AND parentType = 'topic') OR
    (type = 'task' AND parentType = 'project') OR
    (type = 'subtask' AND parentType = 'task')
  ),
  CHECK ((type = 'topic' AND parentId IS NULL) OR (type <> 'topic' AND parentId IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX idx_work_items_due_date ON work_items(dueDate) WHERE dueDate IS NOT NULL AND status IN ('open', 'in_progress');
--> statement-breakpoint
CREATE INDEX idx_work_items_parentage ON work_items(parentId, parentType);
--> statement-breakpoint
CREATE INDEX idx_work_items_assignee ON work_items(assigneeId);
--> statement-breakpoint
CREATE INDEX idx_work_items_created_by ON work_items(createdBy);
--> statement-breakpoint
CREATE INDEX idx_work_items_updated_by ON work_items(updatedBy);
--> statement-breakpoint
-- TABLE COMMENT: work_item_labels — ADR-0006 and ADR-0010. A row means a Label is attached to a Work Item; no row means that Work Item does not carry that Label. Attachments are part of the Work Item and cascade from it.
CREATE TABLE work_item_labels (
  workItemId INTEGER NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  labelId INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (workItemId, labelId)
);
--> statement-breakpoint
CREATE INDEX idx_work_item_labels_label ON work_item_labels(labelId);
--> statement-breakpoint
-- TABLE COMMENT: comments — ADR-0006 and ADR-0019. A row is one household member's Comment on a Work Item, with edited marking only whether it has changed; no row means no Comment exists. Comments are part of their Work Item and cascade from it.
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workItemId INTEGER NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  authorId INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  body TEXT NOT NULL CHECK (body = trim(body) AND length(body) BETWEEN 1 AND 20000),
  createdAt INTEGER NOT NULL,
  edited INTEGER NOT NULL DEFAULT 0 CHECK (edited IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX idx_comments_work_item ON comments(workItemId);
--> statement-breakpoint
CREATE INDEX idx_comments_author ON comments(authorId);
--> statement-breakpoint
-- TABLE COMMENT: work_items_fts — ADR-0013 and ADR-0025. A row is derived keyword-search bookkeeping for one Work Item's Summary and Description; no row means the trigger-maintained index is out of step and can be rebuilt from work_items.
CREATE VIRTUAL TABLE work_items_fts USING fts5(
  summary,
  description,
  content='work_items',
  content_rowid='id',
  tokenize='unicode61 remove_diacritics 2',
  prefix='2 3'
);
--> statement-breakpoint
CREATE TRIGGER work_items_fts_ai AFTER INSERT ON work_items BEGIN
  INSERT INTO work_items_fts(rowid, summary, description) VALUES (new.id, new.summary, new.description);
END;
--> statement-breakpoint
CREATE TRIGGER work_items_fts_ad AFTER DELETE ON work_items BEGIN
  INSERT INTO work_items_fts(work_items_fts, rowid, summary, description) VALUES('delete', old.id, old.summary, old.description);
END;
--> statement-breakpoint
CREATE TRIGGER work_items_fts_au AFTER UPDATE OF summary, description ON work_items BEGIN
  INSERT INTO work_items_fts(work_items_fts, rowid, summary, description) VALUES('delete', old.id, old.summary, old.description);
  INSERT INTO work_items_fts(rowid, summary, description) VALUES (new.id, new.summary, new.description);
END;
