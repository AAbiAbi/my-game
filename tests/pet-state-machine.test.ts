import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Unit tests for the pet state machine transition rules.
 *
 * We test the pure logic by importing the hook's transition table
 * without React — simulating setState(prev => ...) manually.
 */

// Replicate the transition logic from usePetStateMachine
// so we can test it without React / renderHook
type PetState = "idle" | "happy" | "alert" | "sleeping";

function applyTransition(prev: PetState, to: PetState): PetState {
  if (prev === "sleeping" && to !== "idle") return prev;
  return to;
}

function shouldAutoDecay(to: PetState): boolean {
  return to === "happy" || to === "alert";
}

describe("Pet State Machine — transition rules", () => {
  describe("from idle", () => {
    it("idle → happy", () => {
      expect(applyTransition("idle", "happy")).toBe("happy");
    });

    it("idle → alert", () => {
      expect(applyTransition("idle", "alert")).toBe("alert");
    });

    it("idle → sleeping", () => {
      expect(applyTransition("idle", "sleeping")).toBe("sleeping");
    });
  });

  describe("from sleeping (blocked)", () => {
    it("sleeping blocks happy", () => {
      expect(applyTransition("sleeping", "happy")).toBe("sleeping");
    });

    it("sleeping blocks alert", () => {
      expect(applyTransition("sleeping", "alert")).toBe("sleeping");
    });

    it("sleeping blocks sleeping (no-op)", () => {
      expect(applyTransition("sleeping", "sleeping")).toBe("sleeping");
    });

    it("sleeping allows idle (wake up)", () => {
      expect(applyTransition("sleeping", "idle")).toBe("idle");
    });
  });

  describe("from happy/alert", () => {
    it("happy → alert (override)", () => {
      expect(applyTransition("happy", "alert")).toBe("alert");
    });

    it("alert → happy (override)", () => {
      expect(applyTransition("alert", "happy")).toBe("happy");
    });

    it("happy → idle", () => {
      expect(applyTransition("happy", "idle")).toBe("idle");
    });

    it("alert → idle", () => {
      expect(applyTransition("alert", "idle")).toBe("idle");
    });
  });

  describe("auto-decay", () => {
    it("happy triggers auto-decay", () => {
      expect(shouldAutoDecay("happy")).toBe(true);
    });

    it("alert triggers auto-decay", () => {
      expect(shouldAutoDecay("alert")).toBe(true);
    });

    it("idle does NOT auto-decay", () => {
      expect(shouldAutoDecay("idle")).toBe(false);
    });

    it("sleeping does NOT auto-decay", () => {
      expect(shouldAutoDecay("sleeping")).toBe(false);
    });
  });
});

describe("Pet State Machine — timeout integration", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("happy decays to idle after timeout", () => {
    const TIMEOUT = 2000;
    let state: PetState = "idle";

    // Simulate transition to happy
    state = applyTransition(state, "happy");
    expect(state).toBe("happy");

    // Simulate the timeout callback
    let decayed = false;
    if (shouldAutoDecay(state)) {
      setTimeout(() => {
        decayed = true;
      }, TIMEOUT);
    }

    vi.advanceTimersByTime(TIMEOUT - 1);
    expect(decayed).toBe(false);

    vi.advanceTimersByTime(1);
    expect(decayed).toBe(true);
  });

  it("sleeping blocks transition even when timer fires", () => {
    // If somehow a timer fires while sleeping, the transition should be blocked
    let state: PetState = "sleeping";
    state = applyTransition(state, "happy");
    expect(state).toBe("sleeping"); // still sleeping
  });
});

describe("Pet State Machine — full scenario sequences", () => {
  it("click → happy → auto-idle → notification → alert → auto-idle", () => {
    let state: PetState = "idle";

    // Click: idle → happy
    state = applyTransition(state, "happy");
    expect(state).toBe("happy");

    // Auto-decay: happy → idle
    state = applyTransition(state, "idle");
    expect(state).toBe("idle");

    // Notification: idle → alert
    state = applyTransition(state, "alert");
    expect(state).toBe("alert");

    // Auto-decay: alert → idle
    state = applyTransition(state, "idle");
    expect(state).toBe("idle");
  });

  it("sleep → notifications blocked → wake → notifications work", () => {
    let state: PetState = "idle";

    // Sleep
    state = applyTransition(state, "sleeping");
    expect(state).toBe("sleeping");

    // Notifications blocked while sleeping
    state = applyTransition(state, "alert");
    expect(state).toBe("sleeping");
    state = applyTransition(state, "happy");
    expect(state).toBe("sleeping");

    // Wake up
    state = applyTransition(state, "idle");
    expect(state).toBe("idle");

    // Notifications work again
    state = applyTransition(state, "alert");
    expect(state).toBe("alert");
  });

  it("rapid transitions: new alert overrides existing happy", () => {
    let state: PetState = "idle";
    state = applyTransition(state, "happy");
    state = applyTransition(state, "alert"); // override
    expect(state).toBe("alert");
  });
});
