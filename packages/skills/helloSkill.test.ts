import { describe, it, expect } from "vitest";
import { helloSkill } from "./helloSkill";

describe("helloSkill", () => {
  it("handles pet.clicked events", () => {
    expect(helloSkill.canHandle({ type: "pet.clicked" })).toBe(true);
  });

  it("does not handle message.received events", () => {
    expect(helloSkill.canHandle({ type: "message.received" })).toBe(false);
  });

  it("returns greeting with happy mood", async () => {
    const result = await helloSkill.execute({ type: "pet.clicked" });
    expect(result).toEqual({ message: "Hi Abby!", mood: "happy" });
  });
});
