// packages/core/src/skill.ts
import type { SpiritEvent, SkillResult } from "./events";

export interface Skill {
  name: string;
  canHandle(event: SpiritEvent): boolean;
  execute(event: SpiritEvent): Promise<SkillResult>;
}
