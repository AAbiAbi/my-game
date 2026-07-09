import { describe, it, expect } from "vitest";
import { defaultPreferences } from "./preferences";

describe("defaultPreferences", () => {
  it("has expected default values", () => {
    expect(defaultPreferences).toEqual({
      petName: "Abby",
      defaultMood: "idle",
      bubbleDurationMs: 2000,
    });
  });

  it("petName is a non-empty string", () => {
    expect(defaultPreferences.petName.length).toBeGreaterThan(0);
  });

  it("bubbleDurationMs is a positive number", () => {
    expect(defaultPreferences.bubbleDurationMs).toBeGreaterThan(0);
  });
});
