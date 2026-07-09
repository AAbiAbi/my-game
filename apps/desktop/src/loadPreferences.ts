import { mkdir, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { defaultPreferences, type Preferences } from "../../../packages/core/src/preferences";
import { logger } from "../../../packages/core/src/logger";

// In dev: Tauri runs from src-tauri/, so project root is ../
// We use an env var injected by Vite to get the project root
const PROJECT_ROOT = import.meta.env.DEV ? import.meta.env.VITE_PROJECT_ROOT : ".";
const DIR = `${PROJECT_ROOT}/.project-spirit`;
const FILE = `${DIR}/preferences.json`;

export async function loadPreferences(): Promise<Preferences> {
  logger.info("Loading preferences from", FILE);

  if (!(await exists(DIR))) {
    logger.info("Creating preferences directory:", DIR);
    await mkdir(DIR, { recursive: true });
  }

  if (!(await exists(FILE))) {
    logger.info("No preferences file found, writing defaults");
    await writeTextFile(FILE, JSON.stringify(defaultPreferences, null, 2));
    return defaultPreferences;
  }

  try {
    const raw = await readTextFile(FILE);
    const prefs = { ...defaultPreferences, ...JSON.parse(raw) };
    logger.debug("Loaded preferences:", prefs);
    return prefs;
  } catch (err) {
    logger.error("Failed to read preferences, using defaults:", err);
    return defaultPreferences;
  }
}
