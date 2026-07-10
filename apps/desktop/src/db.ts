import Database from "@tauri-apps/plugin-sql";
import { logger } from "../../../packages/core/src/logger";

let db: Database | null = null;

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS events (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    ts        INTEGER NOT NULL,
    type      TEXT    NOT NULL,
    title     TEXT    NOT NULL,
    body      TEXT,
    mood      TEXT,
    priority  TEXT    NOT NULL DEFAULT 'low',
    status    TEXT    NOT NULL DEFAULT 'unread',
    source    TEXT
  )
`;

async function getDb(): Promise<Database | null> {
  if (db) return db;
  try {
    db = await Database.load("sqlite:spirit.db");
    await db.execute(CREATE_TABLE);
    logger.info("DB: initialized spirit.db");
    return db;
  } catch (err) {
    logger.warn("DB: SQLite not available", err);
    return null;
  }
}

export async function initDb(): Promise<Database | null> {
  return getDb();
}

export interface EventRecord {
  id: number;
  ts: number;
  type: string;
  title: string;
  body: string | null;
  mood: string | null;
  priority: string;
  status: string;
  source: string | null;
}

export async function saveEvent(
  type: string,
  title: string,
  body: string | null,
  mood: string | null,
  priority: "high" | "low",
  source: string,
): Promise<void> {
  const d = await getDb();
  if (!d) return;
  try {
    const status = priority === "high" ? "shown" : "digest_pending";
    await d.execute(
      "INSERT INTO events (ts, type, title, body, mood, priority, status, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [Date.now(), type, title, body, mood, priority, status, source],
    );
    logger.debug(`DB: saved event [${priority}] ${title}`);
  } catch (err) {
    logger.error("DB: failed to save event", err);
  }
}

export async function getHistory(limit = 50): Promise<EventRecord[]> {
  const d = await getDb();
  if (!d) return [];
  try {
    return await d.select<EventRecord[]>("SELECT * FROM events ORDER BY ts DESC LIMIT $1", [limit]);
  } catch (err) {
    logger.error("DB: failed to get history", err);
    return [];
  }
}

export async function markAsRead(id: number): Promise<void> {
  const d = await getDb();
  if (!d) return;
  await d.execute("UPDATE events SET status = 'read' WHERE id = $1", [id]);
}

export async function getDigestPending(): Promise<EventRecord[]> {
  const d = await getDb();
  if (!d) return [];
  return await d.select<EventRecord[]>(
    "SELECT * FROM events WHERE status = 'digest_pending' ORDER BY ts ASC",
  );
}
