import type { Skill } from "../core/src/skill";

export const notificationSkill: Skill = {
  name: "notification",
  canHandle: (event) => event.type === "notification.received",
  execute: async (event) => {
    const payload = event.type === "notification.received" ? event.payload : undefined;

    if (payload?.title?.toLowerCase().includes("review")) {
      return {
        message: `High priority: ${payload.body ?? "Review requested"}`,
        mood: "alert",
      };
    }

    return {
      message: `📬 ${payload?.title ?? "New notification"}`,
      mood: "alert",
    };
  },
};
