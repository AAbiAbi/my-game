import { exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { logger } from "../../../packages/core/src/logger";
import type { SpiritEvent } from "../../../packages/core/src/events";

const PROJECT_ROOT = import.meta.env.DEV ? import.meta.env.VITE_PROJECT_ROOT : ".";
const INBOX_FILE = `${PROJECT_ROOT}/.project-spirit/inbox.json`;

export async function pollInbox(): Promise<SpiritEvent[]> {
  if (!(await exists(INBOX_FILE))) {
    return [];
  }

  try {
    const raw = await readTextFile(INBOX_FILE);
    const data = JSON.parse(raw);

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    // Clear inbox after reading
    await writeTextFile(INBOX_FILE, "[]");
    logger.info(`Inbox: read ${data.length} event(s)`);
    logger.debug("Inbox events:", data);
    return data as SpiritEvent[];
  } catch (err) {
    logger.error("Failed to read inbox:", err);
    return [];
  }
}
