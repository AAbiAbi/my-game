// packages/core/src/petState.ts
export type PetState = "idle" | "happy" | "alert" | "sleeping";

export type PetEvent =
  | { type: "USER_CLICK" }
  | { type: "POSITIVE_RESULT" }
  | { type: "IMPORTANT_NOTIFICATION" }
  | { type: "SLEEP" }
  | { type: "WAKE_UP" }
  | { type: "TIMEOUT" };

/**
 * Pure transition function — given current state + event, returns next state.
 * Returns null if the transition is invalid (no change).
 */
export function petTransition(state: PetState, event: PetEvent): PetState | null {
  switch (state) {
    case "idle":
      switch (event.type) {
        case "USER_CLICK":
        case "POSITIVE_RESULT":
          return "happy";
        case "IMPORTANT_NOTIFICATION":
          return "alert";
        case "SLEEP":
          return "sleeping";
        default:
          return null;
      }
    case "happy":
      switch (event.type) {
        case "TIMEOUT":
          return "idle";
        case "SLEEP":
          return "sleeping";
        case "IMPORTANT_NOTIFICATION":
          return "alert";
        default:
          return null;
      }
    case "alert":
      switch (event.type) {
        case "TIMEOUT":
          return "idle";
        case "SLEEP":
          return "sleeping";
        default:
          return null;
      }
    case "sleeping":
      switch (event.type) {
        case "WAKE_UP":
          return "idle";
        default:
          return null;
      }
  }
}
