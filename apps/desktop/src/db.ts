import Database from "@tauri-apps/plugin-sql";
import { logger } from "../../../packages/core/src/logger";

let db: Database | null = null;

const CREATE_EVENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS events (
    id            TEXT PRIMARY KEY,
    source        TEXT NOT NULL,
    event_type    TEXT NOT NULL,
    repo          TEXT,
    actor         TEXT,
    title         TEXT NOT NULL,
    body          TEXT,
    url           TEXT,
    occurred_at   TEXT NOT NULL,
    relevance     TEXT NOT NULL DEFAULT 'direct',
    status        TEXT NOT NULL DEFAULT 'new',
    created_at    TEXT NOT NULL
  )
`;

const CREATE_DIGESTS_TABLE = `
  CREATE TABLE IF NOT EXISTS digests (
    id            TEXT PRIMARY KEY,
    period_start  TEXT NOT NULL,
    period_end    TEXT NOT NULL,
    summary       TEXT NOT NULL,
    event_count   INTEGER NOT NULL,
    created_at    TEXT NOT NULL
  )
`;

async function getDb(): Promise<Database | null> {
  if (db) return db;
  try {
    db = await Database.load("sqlite:spirit.db");
    await db.execute(CREATE_EVENTS_TABLE);
    await db.execute(CREATE_DIGESTS_TABLE);
    logger.info("DB: initialized spirit.db (events + digests)");
    return db;
  } catch (err) {
    logger.warn("DB: SQLite not available", err);
    return null;
  }
}

export async function initDb(): Promise<Database | null> {
  return getDb();
}

// --- Types ---

export interface EventRecord {
  id: string;
  source: string;
  event_type: string;
  repo: string | null;
  actor: string | null;
  title: string;
  body: string | null;
  url: string | null;
  occurred_at: string;
  relevance: string; // "direct" | "digest" | "ignored"
  status: string; // "new" | "shown" | "read" | "digest_pending" | "summarized"
  created_at: string;
}

export interface DigestRecord {
  id: string;
  period_start: string;
  period_end: string;
  summary: string;
  event_count: number;
  created_at: string;
}

// --- Events ---

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveEvent(opts: {
  source: string;
  event_type: string;
  repo?: string;
  actor?: string;
  title: string;
  body?: string;
  url?: string;
  relevance: "direct" | "digest" | "ignored";
}): Promise<boolean> {
  const d = await getDb();
  if (!d) return false;
  try {
    // Dedup: skip if same title exists within last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const existing = await d.select<{ id: string }[]>(
      "SELECT id FROM events WHERE title = $1 AND created_at > $2 LIMIT 1",
      [opts.title, fiveMinAgo],
    );
    if (existing.length > 0) {
      logger.debug(`DB: skipped duplicate event: ${opts.title}`);
      return false;
    }

    const now = new Date().toISOString();
    const status = opts.relevance === "direct" ? "shown" : "digest_pending";

    await d.execute(
      "INSERT INTO events (id, source, event_type, repo, actor, title, body, url, occurred_at, relevance, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
      [
        generateId(),
        opts.source,
        opts.event_type,
        opts.repo ?? null,
        opts.actor ?? null,
        opts.title,
        opts.body ?? null,
        opts.url ?? null,
        now,
        opts.relevance,
        status,
        now,
      ],
    );
    logger.debug(`DB: saved event [${opts.relevance}] ${opts.title}`);
    return true;
  } catch (err) {
    logger.error("DB: failed to save event", err);
    return false;
  }
}

export async function getHistory(limit = 50): Promise<EventRecord[]> {
  const d = await getDb();
  if (!d) return [];
  try {
    return await d.select<EventRecord[]>(
      "SELECT * FROM events WHERE relevance != 'ignored' ORDER BY created_at DESC LIMIT $1",
      [limit],
    );
  } catch (err) {
    logger.error("DB: failed to get history", err);
    return [];
  }
}

export async function markAsRead(id: string): Promise<void> {
  const d = await getDb();
  if (!d) return;
  await d.execute("UPDATE events SET status = 'read' WHERE id = $1", [id]);
}

export async function getDigestPending(): Promise<EventRecord[]> {
  const d = await getDb();
  if (!d) return [];
  try {
    return await d.select<EventRecord[]>(
      "SELECT * FROM events WHERE status = 'digest_pending' ORDER BY created_at ASC",
    );
  } catch (err) {
    logger.error("DB: failed to get digest pending", err);
    return [];
  }
}

export async function markSummarized(ids: string[]): Promise<void> {
  const d = await getDb();
  if (!d || ids.length === 0) return;
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
  await d.execute(`UPDATE events SET status = 'summarized' WHERE id IN (${placeholders})`, ids);
}

// --- Digests ---

export async function saveDigest(
  summary: string,
  eventCount: number,
  periodStart: string,
  periodEnd: string,
): Promise<void> {
  const d = await getDb();
  if (!d) return;
  await d.execute(
    "INSERT INTO digests (id, period_start, period_end, summary, event_count, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    [generateId(), periodStart, periodEnd, summary, eventCount, new Date().toISOString()],
  );
  logger.info(`DB: saved digest (${eventCount} events, ${periodStart} → ${periodEnd})`);
}

export async function getDigests(limit = 10): Promise<DigestRecord[]> {
  const d = await getDb();
  if (!d) return [];
  try {
    return await d.select<DigestRecord[]>(
      "SELECT * FROM digests ORDER BY created_at DESC LIMIT $1",
      [limit],
    );
  } catch (err) {
    logger.error("DB: failed to get digests", err);
    return [];
  }
}
