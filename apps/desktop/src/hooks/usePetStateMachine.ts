import { useState, useCallback, useRef, useEffect } from "react";
import {
  type PetState,
  type PetEvent,
  petTransition,
} from "../../../../packages/core/src/petState";

/**
 * Event-driven pet state machine hook.
 *
 * Transition table (see petTransition):
 *   idle + USER_CLICK/POSITIVE_RESULT → happy
 *   idle + IMPORTANT_NOTIFICATION     → alert
 *   happy/alert + TIMEOUT             → idle
 *   idle/happy/alert + SLEEP          → sleeping
 *   sleeping + WAKE_UP                → idle
 *
 * happy/alert auto-fire TIMEOUT after `timeoutMs`.
 */
export function usePetStateMachine(initialState: PetState, timeoutMs: number) {
  const [state, setState] = useState<PetState>(initialState);
  const timerRef = useRef<number | undefined>(undefined);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const send = useCallback(
    (event: PetEvent) => {
      clearTimeout(timerRef.current);
      setState((prev) => {
        const next = petTransition(prev, event);
        if (next === null) return prev; // invalid transition — no change

        // happy/alert auto-decay: schedule TIMEOUT
        if (next === "happy" || next === "alert") {
          timerRef.current = window.setTimeout(() => {
            setState((cur) => {
              const decayed = petTransition(cur, { type: "TIMEOUT" });
              return decayed ?? cur;
            });
          }, timeoutMs);
        }

        return next;
      });
    },
    [timeoutMs],
  );

  return { state, send } as const;
}
