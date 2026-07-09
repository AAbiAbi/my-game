// packages/skills/src/helloSkill.ts
import type { Skill } from "../core/src/skill";

export const helloSkill: Skill = {
  name: "hello",
  canHandle: (event) => event.type === "pet.clicked",
  execute: async () => ({
    message: "Hi Abby!",
    mood: "happy",
  }),
};
