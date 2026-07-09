import type { Skill } from "../../../packages/core/src/skill";
import { helloSkill } from "../../../packages/skills/helloSkill";
import { notificationSkill } from "../../../packages/skills/notificationSkill";
import { messageSkill } from "../../../packages/skills/messageSkill";

export const skills: Skill[] = [helloSkill, notificationSkill, messageSkill];
