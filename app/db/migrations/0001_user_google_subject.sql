ALTER TABLE users ADD COLUMN googleSubject TEXT;
--> statement-breakpoint
UPDATE users SET googleSubject = 'legacy:' || id WHERE googleSubject IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX idx_users_google_subject ON users(googleSubject);
--> statement-breakpoint
CREATE TRIGGER users_google_subject_required_insert
BEFORE INSERT ON users
WHEN NEW.googleSubject IS NULL
BEGIN
  SELECT RAISE(ABORT, 'users.googleSubject is required');
END;
--> statement-breakpoint
CREATE TRIGGER users_google_subject_required_update
BEFORE UPDATE OF googleSubject ON users
WHEN NEW.googleSubject IS NULL
BEGIN
  SELECT RAISE(ABORT, 'users.googleSubject is required');
END;
