import { exists, readTextFile, writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { defaultPreferences, type Preferences } from "../../../packages/core/src/preferences";

const FILE = "preferences.json";
const DIR = BaseDirectory.AppConfig;

export async function loadPreferences(): Promise<Preferences> {
  try {
    const fileExists = await exists(FILE, { baseDir: DIR });
    if (fileExists) {
      const raw = await readTextFile(FILE, { baseDir: DIR });
      const parsed = JSON.parse(raw);
      return { ...defaultPreferences, ...parsed };
    }
  } catch {
    // Fall through to create default file
  }

  await writeTextFile(FILE, JSON.stringify(defaultPreferences, null, 2), {
    baseDir: DIR,
  });
  return defaultPreferences;
}
