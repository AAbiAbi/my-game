import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { petTransition, type PetState, type PetEvent } from "../packages/core/src/petState";

describe("petTransition — from idle", () => {
  it("USER_CLICK → happy", () => {
    expect(petTransition("idle", { type: "USER_CLICK" })).toBe("happy");
  });

  it("POSITIVE_RESULT → happy", () => {
    expect(petTransition("idle", { type: "POSITIVE_RESULT" })).toBe("happy");
  });

  it("IMPORTANT_NOTIFICATION → alert", () => {
    expect(petTransition("idle", { type: "IMPORTANT_NOTIFICATION" })).toBe("alert");
  });

  it("SLEEP → sleeping", () => {
    expect(petTransition("idle", { type: "SLEEP" })).toBe("sleeping");
  });

  it("TIMEOUT → null (invalid)", () => {
    expect(petTransition("idle", { type: "TIMEOUT" })).toBeNull();
  });

  it("WAKE_UP → null (invalid)", () => {
    expect(petTransition("idle", { type: "WAKE_UP" })).toBeNull();
  });
});

describe("petTransition — from happy", () => {
  it("TIMEOUT → idle", () => {
    expect(petTransition("happy", { type: "TIMEOUT" })).toBe("idle");
  });

  it("SLEEP → sleeping", () => {
    expect(petTransition("happy", { type: "SLEEP" })).toBe("sleeping");
  });

  it("IMPORTANT_NOTIFICATION → alert", () => {
    expect(petTransition("happy", { type: "IMPORTANT_NOTIFICATION" })).toBe("alert");
  });

  it("USER_CLICK → null (already happy)", () => {
    expect(petTransition("happy", { type: "USER_CLICK" })).toBeNull();
  });
});

describe("petTransition — from alert", () => {
  it("TIMEOUT → idle", () => {
    expect(petTransition("alert", { type: "TIMEOUT" })).toBe("idle");
  });

  it("SLEEP → sleeping", () => {
    expect(petTransition("alert", { type: "SLEEP" })).toBe("sleeping");
  });

  it("USER_CLICK → null (blocked)", () => {
    expect(petTransition("alert", { type: "USER_CLICK" })).toBeNull();
  });

  it("IMPORTANT_NOTIFICATION → null (already alert)", () => {
    expect(petTransition("alert", { type: "IMPORTANT_NOTIFICATION" })).toBeNull();
  });
});

describe("petTransition — from sleeping", () => {
  it("WAKE_UP → idle", () => {
    expect(petTransition("sleeping", { type: "WAKE_UP" })).toBe("idle");
  });

  it("USER_CLICK → null (blocked)", () => {
    expect(petTransition("sleeping", { type: "USER_CLICK" })).toBeNull();
  });

  it("IMPORTANT_NOTIFICATION → null (blocked)", () => {
    expect(petTransition("sleeping", { type: "IMPORTANT_NOTIFICATION" })).toBeNull();
  });

  it("SLEEP → null (already sleeping)", () => {
    expect(petTransition("sleeping", { type: "SLEEP" })).toBeNull();
  });

  it("TIMEOUT → null (no-op)", () => {
    expect(petTransition("sleeping", { type: "TIMEOUT" })).toBeNull();
  });
});

describe("petTransition — full scenario sequences", () => {
  function run(events: PetEvent[], initial: PetState = "idle"): PetState {
    let state = initial;
    for (const e of events) {
      state = petTransition(state, e) ?? state;
    }
    return state;
  }

  it("click → happy → timeout → idle → notification → alert → timeout → idle", () => {
    const result = run([
      { type: "USER_CLICK" }, // idle → happy
      { type: "TIMEOUT" }, // happy → idle
      { type: "IMPORTANT_NOTIFICATION" }, // idle → alert
      { type: "TIMEOUT" }, // alert → idle
    ]);
    expect(result).toBe("idle");
  });

  it("sleep → notifications blocked → wake → notifications work", () => {
    const result = run([
      { type: "SLEEP" }, // idle → sleeping
      { type: "IMPORTANT_NOTIFICATION" }, // blocked
      { type: "USER_CLICK" }, // blocked
      { type: "WAKE_UP" }, // sleeping → idle
      { type: "IMPORTANT_NOTIFICATION" }, // idle → alert
    ]);
    expect(result).toBe("alert");
  });

  it("happy + IMPORTANT_NOTIFICATION overrides to alert", () => {
    const result = run([
      { type: "USER_CLICK" }, // idle → happy
      { type: "IMPORTANT_NOTIFICATION" }, // happy → alert
    ]);
    expect(result).toBe("alert");
  });

  it("alert + SLEEP → sleeping immediately", () => {
    const result = run([
      { type: "IMPORTANT_NOTIFICATION" }, // idle → alert
      { type: "SLEEP" }, // alert → sleeping
    ]);
    expect(result).toBe("sleeping");
  });
});

describe("petTransition — auto-decay timing", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("happy auto-decays after timeout duration", () => {
    const TIMEOUT = 2000;
    let state: PetState = "idle";
    state = petTransition(state, { type: "USER_CLICK" })!;
    expect(state).toBe("happy");

    // Simulate what usePetStateMachine does: schedule TIMEOUT event
    const timer = setTimeout(() => {
      state = petTransition(state, { type: "TIMEOUT" }) ?? state;
    }, TIMEOUT);

    vi.advanceTimersByTime(TIMEOUT - 1);
    expect(state).toBe("happy");

    vi.advanceTimersByTime(1);
    expect(state).toBe("idle");

    clearTimeout(timer);
  });

  it("sleeping ignores scheduled TIMEOUT", () => {
    const state: PetState = "sleeping";
    const next = petTransition(state, { type: "TIMEOUT" });
    expect(next).toBeNull();
    expect(state).toBe("sleeping");
  });
});
