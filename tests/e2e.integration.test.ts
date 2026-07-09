import { describe, it, expect } from "vitest";
import { route } from "../packages/core/src/router";
import { helloSkill } from "../packages/skills/helloSkill";
import { notificationSkill } from "../packages/skills/notificationSkill";
import { messageSkill } from "../packages/skills/messageSkill";
import type { SpiritEvent } from "../packages/core/src/events";

// Full skill registry — same order as apps/desktop/src/skills.ts
const skills = [helloSkill, notificationSkill, messageSkill];

describe("E2E: event → router → skill → result", () => {
  it("pet.clicked → helloSkill → 'Hi Abby!'", async () => {
    const event: SpiritEvent = { type: "pet.clicked" };
    const result = await route(event, skills);
    expect(result.message).toBe("Hi Abby!");
    expect(result.mood).toBe("happy");
  });

  it("notification with review → notificationSkill → high priority message", async () => {
    const event: SpiritEvent = {
      type: "notification.received",
      payload: {
        title: "PR review request",
        body: "Lily asked you to review a PR",
      },
    };
    const result = await route(event, skills);
    expect(result.message).toBe("High priority: Lily asked you to review a PR");
    expect(result.mood).toBe("alert");
  });

  it("generic notification → notificationSkill → 📬 title", async () => {
    const event: SpiritEvent = {
      type: "notification.received",
      payload: {
        title: "Build succeeded",
        body: "CI passed on main",
      },
    };
    const result = await route(event, skills);
    expect(result.message).toBe("📬 Build succeeded");
    expect(result.mood).toBe("alert");
  });

  it("message.received → messageSkill → 💬 sender: text", async () => {
    const event: SpiritEvent = {
      type: "message.received",
      payload: { from: "Bob", text: "Hey, are you free?" },
    };
    const result = await route(event, skills);
    expect(result.message).toContain("Bob");
    expect(result.message).toContain("Hey, are you free?");
    expect(result.mood).toBe("happy");
  });

  it("no matching skill → fallback empty result", async () => {
    const event: SpiritEvent = { type: "pet.clicked" };
    const result = await route(event, []);
    expect(result.message).toBe("");
    expect(result.mood).toBe("idle");
  });
});
