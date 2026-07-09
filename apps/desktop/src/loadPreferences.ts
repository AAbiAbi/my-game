import { mkdir, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { defaultPreferences, type Preferences } from "../../../packages/core/src/preferences";

// In dev: Tauri runs from src-tauri/, so project root is ../
// We use an env var injected by Vite to get the project root
const PROJECT_ROOT = import.meta.env.DEV ? import.meta.env.VITE_PROJECT_ROOT : ".";
const DIR = `${PROJECT_ROOT}/.project-spirit`;
const FILE = `${DIR}/preferences.json`;

export async function loadPreferences(): Promise<Preferences> {
  if (!(await exists(DIR))) {
    await mkdir(DIR, { recursive: true });
  }

  if (!(await exists(FILE))) {
    await writeTextFile(FILE, JSON.stringify(defaultPreferences, null, 2));
    return defaultPreferences;
  }

  const raw = await readTextFile(FILE);
  return {
    ...defaultPreferences,
    ...JSON.parse(raw),
  };
}
