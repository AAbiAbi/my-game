import type { Skill } from "../core/src/skill";

export const messageSkill: Skill = {
  name: "message",
  canHandle: (event) => event.type === "message.received",
  execute: async (event) => {
    const payload = event.type === "message.received" ? event.payload : undefined;
    return {
      message: `💬 ${payload?.from ?? "Someone"}: ${payload?.text ?? ""}`,
      mood: "happy",
    };
  },
};
