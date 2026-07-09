import { describe, it, expect } from "vitest";
import { messageSkill } from "./messageSkill";

describe("messageSkill", () => {
  it("handles message.received events", () => {
    expect(messageSkill.canHandle({ type: "message.received" })).toBe(true);
  });

  it("does not handle pet.clicked events", () => {
    expect(messageSkill.canHandle({ type: "pet.clicked" })).toBe(false);
  });

  it("returns happy mood with sender and text", async () => {
    const result = await messageSkill.execute({
      type: "message.received",
      payload: { from: "Alice", text: "hello!" },
    });
    expect(result.message).toContain("Alice");
    expect(result.message).toContain("hello!");
    expect(result.mood).toBe("happy");
  });

  it("handles missing payload gracefully", async () => {
    const result = await messageSkill.execute({
      type: "message.received",
    });
    expect(result.message).toContain("Someone");
  });
});
