import type { Skill } from "../../../packages/core/src/skill";
import { helloSkill } from "../../../packages/skills/helloSkill";
import { prReviewSkill } from "../../../packages/skills/prReviewSkill";
import { notificationSkill } from "../../../packages/skills/notificationSkill";
import { messageSkill } from "../../../packages/skills/messageSkill";

// Order matters: first match wins. prReviewSkill handles review notifications specifically.
export const skills: Skill[] = [helloSkill, prReviewSkill, notificationSkill, messageSkill];
