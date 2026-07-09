import type { SpiritEvent, SkillResult } from "./events";
import type { Skill } from "./skill";

export async function dispatch(event: SpiritEvent, skills: Skill[]): Promise<SkillResult> {
  for (const skill of skills) {
    if (skill.canHandle(event)) {
      return await skill.execute(event);
    }
  }

  return {
    message: "",
    mood: "idle",
  };
}
