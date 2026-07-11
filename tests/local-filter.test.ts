import { describe, it, expect } from "vitest";
import { notificationToSpiritEvent } from "../functions/src/github-events.mjs";
import { route } from "../packages/core/src/router";
import { notificationSkill } from "../packages/skills/notificationSkill";
import { helloSkill } from "../packages/skills/helloSkill";
import { messageSkill } from "../packages/skills/messageSkill";

const skills = [helloSkill, notificationSkill, messageSkill];

// Mirrors the logic in App.tsx WebSocket callback
function resolveLocalPriority(payload: Record<string, unknown>): "high" | "low" {
  const raw = payload?.priority;
  return raw === "low" ? "low" : "high";
}

describe("Local event filter: all events stored, only high priority bubbles", () => {
  describe("priority resolution from enriched payload", () => {
    it("explicit high → high", () => {
      expect(resolveLocalPriority({ priority: "high" })).toBe("high");
    });

    it("explicit low → low", () => {
      expect(resolveLocalPriority({ priority: "low" })).toBe("low");
    });

    it("missing priority → defaults to high", () => {
      expect(resolveLocalPriority({})).toBe("high");
    });

    it("undefined priority → defaults to high", () => {
      expect(resolveLocalPriority({ priority: undefined })).toBe("high");
    });
  });

  describe("end-to-end: Function enriches → client filters", () => {
    it("review_requested → Function marks high → client shows bubble", async () => {
      const { event, priority } = notificationToSpiritEvent({
        reason: "review_requested",
        subject: { title: "Fix auth bug", type: "PullRequest" },
        repository: { full_name: "Azure/AgentBaker" },
      });

      // Simulate Function enrichment
      const enriched = {
        ...event,
        payload: {
          ...event.payload,
          priority,
          reason: "review_requested",
          repo: "Azure/AgentBaker",
        },
      };

      // Client resolves priority
      const clientPriority = resolveLocalPriority(enriched.payload);
      expect(clientPriority).toBe("high");

      // Client routes and shows bubble
      const result = await route(enriched, skills);
      expect(result.message).toContain("High priority");
    });

    it("subscribed → Function marks low → client stores only, no bubble", async () => {
      const { event, priority } = notificationToSpiritEvent({
        reason: "subscribed",
        subject: { title: "Release v1.2.0", type: "Release" },
        repository: { full_name: "Azure/AgentBaker" },
      });

      const enriched = {
        ...event,
        payload: { ...event.payload, priority, reason: "subscribed", repo: "Azure/AgentBaker" },
      };

      const clientPriority = resolveLocalPriority(enriched.payload);
      expect(clientPriority).toBe("low");
      // Low priority → stored in DB with digest_pending, NO bubble shown
    });

    it("mention → high → bubble with content", async () => {
      const { event, priority } = notificationToSpiritEvent({
        reason: "mention",
        subject: { title: "Need your input", type: "Issue" },
        repository: { full_name: "Azure/AgentBaker" },
      });

      const enriched = {
        ...event,
        payload: { ...event.payload, priority, reason: "mention", repo: "Azure/AgentBaker" },
      };

      expect(resolveLocalPriority(enriched.payload)).toBe("high");
      const result = await route(enriched, skills);
      expect(result.message).toContain("[mention] Need your input");
    });

    it("manual watch → low → no bubble", () => {
      const { event, priority } = notificationToSpiritEvent({
        reason: "manual",
        subject: { title: "Some PR merged", type: "PullRequest" },
        repository: { full_name: "Azure/AgentBaker" },
      });

      const enriched = {
        ...event,
        payload: { ...event.payload, priority, reason: "manual", repo: "Azure/AgentBaker" },
      };

      expect(resolveLocalPriority(enriched.payload)).toBe("low");
    });

    it("webhook events (no priority field) → default high → bubble", async () => {
      // Webhook events from github-webhook don't have priority field
      const result = await route(
        {
          type: "notification.received",
          payload: { title: "PR opened", body: "alice: New feature" },
        },
        skills,
      );

      expect(resolveLocalPriority({ title: "PR opened" })).toBe("high"); // no priority → high
      expect(result.message).toBe("📬 PR opened");
    });
  });
});
