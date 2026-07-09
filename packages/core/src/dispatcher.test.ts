import { describe, it, expect } from "vitest";
import { dispatch } from "./dispatcher";
import type { Skill } from "./skill";
import type { SpiritEvent } from "./events";

describe("dispatch", () => {
  const clickEvent: SpiritEvent = { type: "pet.clicked" };
  const msgEvent: SpiritEvent = { type: "message.received" };

  it("returns fallback when no skill matches", async () => {
    const result = await dispatch(clickEvent, []);
    expect(result).toEqual({ message: "", mood: "idle" });
  });

  it("returns result from matching skill", async () => {
    const skill: Skill = {
      name: "test",
      canHandle: (e) => e.type === "pet.clicked",
      execute: async () => ({ message: "hello", mood: "happy" }),
    };
    const result = await dispatch(clickEvent, [skill]);
    expect(result).toEqual({ message: "hello", mood: "happy" });
  });

  it("first matching skill wins", async () => {
    const skill1: Skill = {
      name: "first",
      canHandle: () => true,
      execute: async () => ({ message: "first", mood: "happy" }),
    };
    const skill2: Skill = {
      name: "second",
      canHandle: () => true,
      execute: async () => ({ message: "second", mood: "alert" }),
    };
    const result = await dispatch(clickEvent, [skill1, skill2]);
    expect(result.message).toBe("first");
  });

  it("skips skills that don't match", async () => {
    const noMatch: Skill = {
      name: "no-match",
      canHandle: () => false,
      execute: async () => ({ message: "wrong", mood: "alert" }),
    };
    const matches: Skill = {
      name: "matches",
      canHandle: (e) => e.type === "message.received",
      execute: async () => ({ message: "correct", mood: "happy" }),
    };
    const result = await dispatch(msgEvent, [noMatch, matches]);
    expect(result.message).toBe("correct");
  });
});
