import { describe, it, expect } from "vitest";
import { notificationSkill } from "./notificationSkill";

describe("notificationSkill", () => {
  it("handles notification.received events", () => {
    expect(notificationSkill.canHandle({ type: "notification.received" })).toBe(true);
  });

  it("does not handle pet.clicked events", () => {
    expect(notificationSkill.canHandle({ type: "pet.clicked" })).toBe(false);
  });

  it("returns alert mood with title", async () => {
    const result = await notificationSkill.execute({
      type: "notification.received",
      payload: { title: "PR merged", body: "Your PR was merged" },
    });
    expect(result.message).toContain("PR merged");
    expect(result.mood).toBe("alert");
  });

  it("handles missing payload gracefully", async () => {
    const result = await notificationSkill.execute({
      type: "notification.received",
    });
    expect(result.message).toContain("New notification");
  });
});
