import type { SpiritEvent, SkillResult } from "./events";
import type { Skill } from "./skill";
import { logger } from "./logger";

export async function route(event: SpiritEvent, skills: Skill[]): Promise<SkillResult> {
  logger.info(`Routing event: ${event.type}`);
  logger.debug("Event payload:", event.type !== "pet.clicked" ? event.payload : undefined);

  for (const skill of skills) {
    if (skill.canHandle(event)) {
      logger.info(`Matched skill: ${skill.name}`);
      try {
        const result = await skill.execute(event);
        logger.debug("Skill result:", result);
        return result;
      } catch (err) {
        logger.error(`Skill "${skill.name}" threw:`, err);
        throw err;
      }
    }
  }

  logger.warn(`No skill matched event: ${event.type}`);
  return {
    message: "",
    mood: "idle",
  };
}
