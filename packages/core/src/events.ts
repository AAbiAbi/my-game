// packages/core/src/events.ts
export type SpiritEvent =
  | { type: "pet.clicked"; payload?: undefined }
  | { type: "notification.received"; payload?: { title: string; body: string } }
  | { type: "message.received"; payload?: { from: string; text: string } };

export type SkillResult = {
  message: string;
  mood?: "idle" | "happy" | "alert";
};
