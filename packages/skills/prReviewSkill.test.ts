import { describe, it, expect } from "vitest";
import { prReviewSkill } from "./prReviewSkill";

describe("prReviewSkill", () => {
  it("handles notification with 'review' in title", () => {
    expect(
      prReviewSkill.canHandle({
        type: "notification.received",
        payload: { title: "PR review request", body: "" },
      }),
    ).toBe(true);
  });

  it("does not handle notification without 'review' in title", () => {
    expect(
      prReviewSkill.canHandle({
        type: "notification.received",
        payload: { title: "Build passed", body: "" },
      }),
    ).toBe(false);
  });

  it("does not handle pet.clicked events", () => {
    expect(prReviewSkill.canHandle({ type: "pet.clicked" })).toBe(false);
  });

  it("returns high priority message with body", async () => {
    const result = await prReviewSkill.execute({
      type: "notification.received",
      payload: { title: "PR review request", body: "Lily asked you to review a PR" },
    });
    expect(result.message).toBe("High priority: Lily asked you to review a PR");
    expect(result.mood).toBe("alert");
  });
});
