import { describe, it, expect } from "vitest";
import { route } from "./router";
import type { Skill } from "./skill";
import type { SpiritEvent } from "./events";

describe("route", () => {
  const clickEvent: SpiritEvent = { type: "pet.clicked" };
  const msgEvent: SpiritEvent = {
    type: "message.received",
    payload: { from: "Alice", text: "hey" },
  };

  it("returns fallback when no skill matches", async () => {
    const result = await route(clickEvent, []);
    expect(result).toEqual({ message: "", mood: "idle" });
  });

  it("returns result from matching skill", async () => {
    const skill: Skill = {
      name: "test",
      canHandle: (e) => e.type === "pet.clicked",
      execute: async () => ({ message: "hello", mood: "happy" }),
    };
    const result = await route(clickEvent, [skill]);
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
    const result = await route(clickEvent, [skill1, skill2]);
    expect(result.message).toBe("first");
  });

  it("routes message.received to correct skill", async () => {
    const skill: Skill = {
      name: "msg",
      canHandle: (e) => e.type === "message.received",
      execute: async () => ({ message: "got msg", mood: "happy" }),
    };
    const result = await route(msgEvent, [skill]);
    expect(result.message).toBe("got msg");
  });
});
