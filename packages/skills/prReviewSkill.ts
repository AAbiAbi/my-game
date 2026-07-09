import type { Skill } from "../core/src/skill";

export const prReviewSkill: Skill = {
  name: "pr-review",
  canHandle: (event) => {
    if (event.type !== "notification.received") return false;
    return event.payload?.title?.toLowerCase().includes("review") ?? false;
  },
  execute: async (event) => {
    const payload = event.type === "notification.received" ? event.payload : undefined;
    return {
      message: `High priority: ${payload?.body ?? "Review requested"}`,
      mood: "alert",
    };
  },
};
