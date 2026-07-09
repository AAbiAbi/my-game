import { describe, it, expect } from "vitest";
import { notificationSkill } from "./notificationSkill";

describe("notificationSkill", () => {
  it("handles notification.received events", () => {
    expect(notificationSkill.canHandle({ type: "notification.received" })).toBe(true);
  });

  it("does not handle pet.clicked events", () => {
    expect(notificationSkill.canHandle({ type: "pet.clicked" })).toBe(false);
  });

  it("returns high priority for review requests", async () => {
    const result = await notificationSkill.execute({
      type: "notification.received",
      payload: { title: "PR review request", body: "Lily asked you to review a PR" },
    });
    expect(result.message).toBe("High priority: Lily asked you to review a PR");
    expect(result.mood).toBe("alert");
  });

  it("returns generic notification for non-review", async () => {
    const result = await notificationSkill.execute({
      type: "notification.received",
      payload: { title: "Build succeeded", body: "CI passed on main" },
    });
    expect(result.message).toBe("📬 Build succeeded");
    expect(result.mood).toBe("alert");
  });

  it("handles missing payload gracefully", async () => {
    const result = await notificationSkill.execute({
      type: "notification.received",
    });
    expect(result.message).toContain("New notification");
  });
});
