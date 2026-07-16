import { useState, useCallback, useRef, useEffect } from "react";
import type { PetState } from "../../../../packages/core/src/petState";

/**
 * Centralized pet state machine.
 *
 * Rules:
 *  - sleeping → ignores happy/alert; only wake() exits
 *  - happy/alert → auto-reset to idle after timeoutMs
 *  - idle → accepts any transition
 */
export function usePetStateMachine(initialState: PetState, timeoutMs: number) {
  const [state, setState] = useState<PetState>(initialState);
  const timerRef = useRef<number | undefined>(undefined);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const transition = useCallback(
    (to: PetState) => {
      clearTimeout(timerRef.current);
      setState((prev) => {
        // sleeping blocks everything except explicit wake (idle)
        if (prev === "sleeping" && to !== "idle") return prev;

        // happy/alert auto-decay back to idle
        if (to === "happy" || to === "alert") {
          timerRef.current = window.setTimeout(() => setState("idle"), timeoutMs);
        }
        return to;
      });
    },
    [timeoutMs],
  );

  const sleep = useCallback(() => {
    clearTimeout(timerRef.current);
    setState("sleeping");
  }, []);

  const wake = useCallback(() => {
    clearTimeout(timerRef.current);
    setState("idle");
  }, []);

  return { state, transition, sleep, wake } as const;
}
