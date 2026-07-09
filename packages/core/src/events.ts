// packages/core/src/events.ts
export type SpiritEvent = {
  type: "pet.clicked" | "message.received";
  payload?: unknown;
};

export type SkillResult = {
  message: string;
  mood?: "idle" | "happy" | "alert";
};
