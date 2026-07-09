import { mkdir, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { homeDir, join } from "@tauri-apps/api/path";
import { defaultPreferences, type Preferences } from "../../../packages/core/src/preferences";

async function getPreferencesPath() {
  const home = await homeDir();
  const dir = await join(home, ".project-spirit");
  const file = await join(dir, "preferences.json");
  return { dir, file };
}

export async function loadPreferences(): Promise<Preferences> {
  const { dir, file } = await getPreferencesPath();

  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true });
  }

  if (!(await exists(file))) {
    await writeTextFile(file, JSON.stringify(defaultPreferences, null, 2));
    return defaultPreferences;
  }

  const raw = await readTextFile(file);
  return {
    ...defaultPreferences,
    ...JSON.parse(raw),
  };
}
