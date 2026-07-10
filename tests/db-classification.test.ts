import { describe, it, expect } from "vitest";

// Test the classification logic that determines what gets saved to DB
// (mirrors the logic in App.tsx WebSocket callback)

describe("Event classification for DB storage", () => {
  // Only external events (WebSocket) should be stored
  // UI interactions (pet.clicked, sleep, wake) should NOT be stored

  const externalEvents = [
    {
      type: "notification.received",
      payload: { title: "[mention] Fix bug", body: "Issue in org/repo" },
    },
    {
      type: "notification.received",
      payload: { title: "PR opened", body: "alice: New feature" },
    },
    {
      type: "message.received",
      payload: { from: "Bob", text: "Hey!" },
    },
  ];

  const uiEvents = [{ type: "pet.clicked" }];

  function shouldStore(_eventType: string, source: string): boolean {
    // Only store events from external sources (websocket, github-webhook, github-poll)
    return source !== "ui";
  }

  it("stores external WebSocket events", () => {
    for (const event of externalEvents) {
      expect(shouldStore(event.type, "websocket")).toBe(true);
    }
  });

  it("does NOT store UI interaction events", () => {
    for (const event of uiEvents) {
      expect(shouldStore(event.type, "ui")).toBe(false);
    }
  });

  it("stores github-webhook events", () => {
    expect(shouldStore("notification.received", "github-webhook")).toBe(true);
  });

  it("stores github-poll events", () => {
    expect(shouldStore("notification.received", "github-poll")).toBe(true);
  });
});
