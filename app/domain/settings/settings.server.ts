import { eq } from "drizzle-orm";

import type { DatabaseClient } from "~/db/client";
import { themes, users, type Theme } from "~/db/schema";

export interface SettingsLabelUsage {
  labelId: number;
  usageCount: number;
}

export type SettingsMutationResult = { ok: true } | { ok: false; error: { field?: string; message: string } };

export function loadSettings(database: DatabaseClient) {
  const labelUsageCounts = database.sqlite
    .prepare(
      `
      SELECT labelId, COUNT(workItemId) AS usageCount
      FROM work_item_labels
      GROUP BY labelId
      ORDER BY labelId
      `,
    )
    .all() as SettingsLabelUsage[];
  return { labelUsageCounts, timezones: supportedTimezones() };
}

export function updateUserTheme(database: DatabaseClient, userId: number, theme: string, now = Date.now()): SettingsMutationResult {
  if (!isTheme(theme)) {
    return { ok: false, error: { field: "theme", message: "Choose System, Light or Dark." } };
  }
  database.db.update(users).set({ theme, updatedAt: now }).where(eq(users.id, userId)).run();
  return { ok: true };
}

export function updateHouseholdTimezone(database: DatabaseClient, timezone: string, now = Date.now()): SettingsMutationResult {
  const trimmed = timezone.trim();
  if (!isValidTimezone(trimmed)) {
    return { ok: false, error: { field: "timezone", message: "Choose a valid Household Timezone." } };
  }
  database.sqlite.prepare("UPDATE household_settings SET timezone = ?, updatedAt = ? WHERE id = 1").run(trimmed, now);
  return { ok: true };
}

export function createLabel(database: DatabaseClient, name: string, now = Date.now()): SettingsMutationResult {
  const trimmed = name.trim();
  const validation = validateLabelName(database, trimmed);
  if (validation) return { ok: false, error: validation };
  database.sqlite.prepare("INSERT INTO labels (name, createdAt, updatedAt) VALUES (?, ?, ?)").run(trimmed, now, now);
  return { ok: true };
}

export function renameLabel(database: DatabaseClient, id: number, name: string, now = Date.now()): SettingsMutationResult {
  const trimmed = name.trim();
  if (!labelExists(database, id)) {
    return { ok: false, error: { field: "id", message: "Choose a valid Label." } };
  }
  const validation = validateLabelName(database, trimmed, id);
  if (validation) return { ok: false, error: validation };
  database.sqlite.prepare("UPDATE labels SET name = ?, updatedAt = ? WHERE id = ?").run(trimmed, now, id);
  return { ok: true };
}

export function deleteLabel(database: DatabaseClient, id: number): SettingsMutationResult {
  if (!labelExists(database, id)) {
    return { ok: false, error: { field: "id", message: "Choose a valid Label." } };
  }
  database.sqlite.prepare("DELETE FROM labels WHERE id = ?").run(id);
  return { ok: true };
}

export function parseLabelId(value: string | undefined) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isTheme(value: string): value is Theme {
  return themes.includes(value as Theme);
}

function supportedTimezones() {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone");
  }
  return ["UTC"];
}

function isValidTimezone(timezone: string) {
  if (timezone.length === 0) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function validateLabelName(database: DatabaseClient, name: string, excludingId?: number) {
  if (name.length === 0) {
    return { field: "name", message: "Label name is required." };
  }
  if (name.length > 30) {
    return { field: "name", message: "Label name must be 30 characters or fewer." };
  }
  const existing = database.sqlite.prepare("SELECT id FROM labels WHERE lower(name) = lower(?)").get(name) as { id: number } | undefined;
  if (existing && existing.id !== excludingId) {
    return { field: "name", message: "A Label with that name already exists." };
  }
  return null;
}

function labelExists(database: DatabaseClient, id: number) {
  return Boolean(database.sqlite.prepare("SELECT id FROM labels WHERE id = ?").get(id));
}
