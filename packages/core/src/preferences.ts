import type { PetState } from "./petState";

/** @deprecated Use PetState instead */
export type PetMood = PetState;

export type Preferences = {
  petName: string;
  defaultMood: PetState;
  bubbleDurationMs: number;
};

export const defaultPreferences: Preferences = {
  petName: "Abby",
  defaultMood: "idle",
  bubbleDurationMs: 2000,
};
