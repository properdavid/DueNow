import { relations } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const workItemTypes = ["topic", "project", "task", "subtask"] as const;
export const workItemStatuses = ["open", "in_progress", "completed", "closed"] as const;
export const themes = ["system", "light", "dark"] as const;

export type WorkItemType = (typeof workItemTypes)[number];
export type WorkItemStatus = (typeof workItemStatuses)[number];
export type Theme = (typeof themes)[number];

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    googleSubject: text("googleSubject").notNull().unique(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    theme: text("theme", { enum: themes }).notNull().default("system"),
    createdAt: integer("createdAt").notNull(),
    updatedAt: integer("updatedAt").notNull(),
  },
  (table) => [check("users_theme_check", sql`${table.theme} IN ('system', 'light', 'dark')`)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expiresAt").notNull(),
    createdAt: integer("createdAt").notNull(),
  },
  (table) => [index("idx_sessions_user").on(table.userId), index("idx_sessions_expires").on(table.expiresAt)],
);

export const labels = sqliteTable(
  "labels",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    createdAt: integer("createdAt").notNull(),
    updatedAt: integer("updatedAt").notNull(),
  },
  (table) => [
    check("labels_name_check", sql`${table.name} = trim(${table.name}) AND length(${table.name}) BETWEEN 1 AND 30`),
    uniqueIndex("idx_labels_name_ci").on(sql`lower(${table.name})`),
  ],
);

export const householdSettings = sqliteTable(
  "household_settings",
  {
    id: integer("id").primaryKey(),
    timezone: text("timezone").notNull(),
    createdAt: integer("createdAt").notNull(),
    updatedAt: integer("updatedAt").notNull(),
  },
  (table) => [
    check("household_settings_single_row", sql`${table.id} = 1`),
    check("household_settings_timezone_present", sql`length(trim(${table.timezone})) > 0`),
  ],
);

export const workItems = sqliteTable(
  "work_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type", { enum: workItemTypes }).notNull(),
    parentId: integer("parentId"),
    parentType: text("parentType", { enum: workItemTypes }),
    summary: text("summary").notNull(),
    description: text("description").notNull().default(""),
    assigneeId: integer("assigneeId").references(() => users.id, { onDelete: "restrict" }),
    status: text("status", { enum: workItemStatuses }).notNull().default("open"),
    dueDate: text("dueDate"),
    createdAt: integer("createdAt").notNull(),
    updatedAt: integer("updatedAt").notNull(),
    createdBy: integer("createdBy").notNull().references(() => users.id, { onDelete: "restrict" }),
    updatedBy: integer("updatedBy").notNull().references(() => users.id, { onDelete: "restrict" }),
  },
  (table) => [
    unique("work_items_id_type_unique").on(table.id, table.type),
    foreignKey({
      columns: [table.parentId, table.parentType],
      foreignColumns: [table.id, table.type],
      name: "work_items_parent_fk",
    }).onDelete("restrict"),
    index("idx_work_items_due_date").on(table.dueDate),
    index("idx_work_items_parentage").on(table.parentId, table.parentType),
    check("work_items_type_check", sql`${table.type} IN ('topic', 'project', 'task', 'subtask')`),
    check("work_items_status_check", sql`${table.status} IN ('open', 'in_progress', 'completed', 'closed')`),
    check("work_items_summary_check", sql`${table.summary} = trim(${table.summary}) AND length(${table.summary}) BETWEEN 1 AND 200`),
    check("work_items_description_check", sql`length(${table.description}) <= 20000`),
    check("work_items_due_date_check", sql`${table.dueDate} IS NULL OR ${table.dueDate} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`),
    check("work_items_parent_type_check", sql`(${table.type} = 'topic' AND ${table.parentType} IS NULL) OR (${table.type} = 'project' AND ${table.parentType} = 'topic') OR (${table.type} = 'task' AND ${table.parentType} = 'project') OR (${table.type} = 'subtask' AND ${table.parentType} = 'task')`),
    check("work_items_parent_presence_check", sql`(${table.type} = 'topic' AND ${table.parentId} IS NULL) OR (${table.type} <> 'topic' AND ${table.parentId} IS NOT NULL)`),
  ],
);

export const workItemLabels = sqliteTable(
  "work_item_labels",
  {
    workItemId: integer("workItemId").notNull().references(() => workItems.id, { onDelete: "cascade" }),
    labelId: integer("labelId").notNull().references(() => labels.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.workItemId, table.labelId] }), index("idx_work_item_labels_label").on(table.labelId)],
);

export const comments = sqliteTable(
  "comments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workItemId: integer("workItemId").notNull().references(() => workItems.id, { onDelete: "cascade" }),
    authorId: integer("authorId").notNull().references(() => users.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    createdAt: integer("createdAt").notNull(),
    edited: integer("edited", { mode: "boolean" }).notNull().default(false),
  },
  (table) => [
    index("idx_comments_work_item").on(table.workItemId),
    index("idx_comments_author").on(table.authorId),
    check("comments_body_check", sql`${table.body} = trim(${table.body}) AND length(${table.body}) BETWEEN 1 AND 20000`),
    check("comments_edited_check", sql`${table.edited} IN (0, 1)`),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  assignedWorkItems: many(workItems, { relationName: "assignee" }),
  comments: many(comments),
}));

export const workItemsRelations = relations(workItems, ({ one, many }) => ({
  assignee: one(users, { fields: [workItems.assigneeId], references: [users.id], relationName: "assignee" }),
  createdByUser: one(users, { fields: [workItems.createdBy], references: [users.id] }),
  updatedByUser: one(users, { fields: [workItems.updatedBy], references: [users.id] }),
  labels: many(workItemLabels),
  comments: many(comments),
}));

export const schema = {
  users,
  sessions,
  labels,
  householdSettings,
  workItems,
  workItemLabels,
  comments,
};
