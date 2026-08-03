import crypto from "node:crypto";

import { eq } from "drizzle-orm";
import { redirect } from "react-router";

import { database as defaultDatabase } from "~/db";
import type { DatabaseClient } from "~/db/client";
import { sessions, users, type Theme } from "~/db/schema";

const SESSION_COOKIE = "sid";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

export interface GoogleIdentityClaims {
  email: string;
  name: string;
  subject: string;
}

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  theme: Theme;
};

export class AllowlistRejection extends Error {
  constructor(readonly email: string) {
    super("The Google account is not set up for this household.");
  }
}

export interface AuthContext {
  database?: DatabaseClient;
  env?: Record<string, string | undefined>;
}

export function getDatabase(context?: unknown): DatabaseClient {
  return hasDatabaseContext(context) ? context.database : defaultDatabase;
}

export function getEnv(context?: unknown): Record<string, string | undefined> {
  return hasEnvContext(context) ? context.env : process.env;
}

function hasDatabaseContext(context: unknown): context is { database: DatabaseClient } {
  return typeof context === "object" && context !== null && "database" in context && Boolean((context as AuthContext).database);
}

function hasEnvContext(context: unknown): context is { env: Record<string, string | undefined> } {
  return typeof context === "object" && context !== null && "env" in context && Boolean((context as AuthContext).env);
}

function allowedEmails(env: Record<string, string | undefined>) {
  return new Set(
    (env.DUENOW_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function isAllowlisted(email: string, env: Record<string, string | undefined>) {
  return allowedEmails(env).has(email.trim().toLowerCase());
}

export async function getOrCreateUser(database: DatabaseClient, claims: GoogleIdentityClaims, env = process.env): Promise<AuthUser> {
  const email = claims.email.trim();
  const name = claims.name.trim() || email.split("@")[0] || email;

  if (!isAllowlisted(email, env)) {
    throw new AllowlistRejection(email);
  }

  const now = Date.now();
  const existingBySubject = database.db
    .select({ id: users.id, theme: users.theme })
    .from(users)
    .where(eq(users.googleSubject, claims.subject))
    .get();
  const existing =
    existingBySubject ??
    database.db
      .select({ id: users.id, theme: users.theme })
      .from(users)
      .where(eq(users.email, email))
      .get();

  if (existing) {
    database.db
      .update(users)
      .set({ googleSubject: claims.subject, email, name, updatedAt: now })
      .where(eq(users.id, existing.id))
      .run();
    return { id: existing.id, email, name, theme: existing.theme };
  }

  const result = database.db
    .insert(users)
    .values({ googleSubject: claims.subject, email, name, createdAt: now, updatedAt: now })
    .run();
  const id = Number(result.lastInsertRowid);
  return { id, email, name, theme: "system" };
}

export function createSession(database: DatabaseClient, userId: number, now = Date.now()) {
  const id = crypto.randomBytes(32).toString("base64url");
  database.db.insert(sessions).values({ id, userId, createdAt: now, expiresAt: now + SESSION_MAX_AGE_MS }).run();
  return { id, expiresAt: now + SESSION_MAX_AGE_MS };
}

export function destroySession(database: DatabaseClient, sessionId: string | null) {
  if (sessionId) {
    database.db.delete(sessions).where(eq(sessions.id, sessionId)).run();
  }
}

export async function requireUser(request: Request, context?: unknown): Promise<AuthUser> {
  const database = getDatabase(context);
  const sessionId = readCookie(request.headers.get("Cookie"), SESSION_COOKIE);
  if (!sessionId) {
    throw redirect("/login");
  }

  const row = database.db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      email: users.email,
      name: users.name,
      theme: users.theme,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .get();

  if (!row || row.expiresAt <= Date.now()) {
    destroySession(database, sessionId);
    throw redirect("/login");
  }

  return { id: row.userId, email: row.email, name: row.name, theme: row.theme };
}

export function sessionCookie(sessionId: string, env = process.env) {
  return serializeCookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "Lax",
    secure: env.NODE_ENV === "production",
  });
}

export function expiredSessionCookie(env = process.env) {
  return serializeCookie(SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "Lax",
    secure: env.NODE_ENV === "production",
  });
}

export function readSessionCookie(request: Request) {
  return readCookie(request.headers.get("Cookie"), SESSION_COOKIE);
}

export function readCookie(header: string | null, name: string) {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }
  return null;
}

export function serializeCookie(
  name: string,
  value: string,
  options: { httpOnly?: boolean; maxAge?: number; path?: string; sameSite?: "Lax" | "Strict"; secure?: boolean } = {},
) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}
