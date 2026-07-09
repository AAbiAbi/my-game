export type PetMood = "idle" | "happy" | "sleeping" | "alert";

export type Preferences = {
  petName: string;
  defaultMood: PetMood;
  bubbleDurationMs: number;
};

export const defaultPreferences: Preferences = {
  petName: "Abby",
  defaultMood: "idle",
  bubbleDurationMs: 2000,
};
