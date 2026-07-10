import { describe, it, expect } from "vitest";
import { notificationToSpiritEvent, githubToSpiritEvent } from "../functions/src/github-events.mjs";
import { route } from "../packages/core/src/router";
import { notificationSkill } from "../packages/skills/notificationSkill";
import { messageSkill } from "../packages/skills/messageSkill";
import { helloSkill } from "../packages/skills/helloSkill";

const skills = [helloSkill, notificationSkill, messageSkill];

describe("E2E: GitHub notification → SpiritEvent → router → skill", () => {
  describe("notificationToSpiritEvent", () => {
    it("converts review_requested to high priority event", () => {
      const event = notificationToSpiritEvent({
        reason: "review_requested",
        subject: { title: "Fix auth bug", type: "PullRequest" },
        repository: { full_name: "org/repo" },
      });

      expect(event.type).toBe("notification.received");
      expect(event.payload.title).toBe("[review_requested] Fix auth bug");
      expect(event.payload.body).toBe("PullRequest in org/repo");
    });

    it("converts mention to high priority event", () => {
      const event = notificationToSpiritEvent({
        reason: "mention",
        subject: { title: "Need help with deployment", type: "Issue" },
        repository: { full_name: "team/project" },
      });

      expect(event.payload.title).toBe("[mention] Need help with deployment");
    });

    it("converts assign to high priority event", () => {
      const event = notificationToSpiritEvent({
        reason: "assign",
        subject: { title: "Update docs", type: "Issue" },
        repository: { full_name: "org/docs" },
      });

      expect(event.payload.title).toBe("[assign] Update docs");
    });

    it("converts subscribed to normal priority", () => {
      const event = notificationToSpiritEvent({
        reason: "subscribed",
        subject: { title: "Release v2.0", type: "Release" },
        repository: { full_name: "org/lib" },
      });

      expect(event.payload.title).toBe("Release v2.0");
    });
  });

  describe("githubToSpiritEvent (webhook)", () => {
    it("converts PR review_requested", () => {
      const event = githubToSpiritEvent("pull_request", {
        action: "review_requested",
        pull_request: { title: "Add caching layer" },
        sender: { login: "lily" },
      });

      expect(event.type).toBe("notification.received");
      expect(event.payload.title).toBe("PR review request");
      expect(event.payload.body).toBe("lily asked you to review: Add caching layer");
    });

    it("converts PR opened", () => {
      const event = githubToSpiritEvent("pull_request", {
        action: "opened",
        pull_request: { title: "New feature" },
        sender: { login: "bob" },
      });

      expect(event.payload.title).toBe("PR opened");
      expect(event.payload.body).toBe("bob: New feature");
    });

    it("converts issue assigned", () => {
      const event = githubToSpiritEvent("issues", {
        action: "assigned",
        issue: { title: "Fix bug #123" },
        sender: { login: "alice" },
      });

      expect(event.payload.title).toBe("Issue assigned");
      expect(event.payload.body).toBe("alice: Fix bug #123");
    });

    it("converts push event", () => {
      const event = githubToSpiritEvent("push", {
        repository: { full_name: "org/repo" },
        pusher: { name: "dev" },
        commits: [{}, {}, {}],
      });

      expect(event.payload.title).toBe("Push to org/repo");
      expect(event.payload.body).toBe("dev pushed 3 commit(s)");
    });

    it("ignores unknown event types", () => {
      const event = githubToSpiritEvent("star", { action: "created" });
      expect(event).toBeNull();
    });

    it("ignores PR actions that are not tracked", () => {
      const event = githubToSpiritEvent("pull_request", {
        action: "labeled",
        pull_request: { title: "x" },
        sender: { login: "y" },
      });
      expect(event).toBeNull();
    });
  });

  describe("full pipeline: GitHub → event → router → skill result", () => {
    it("review_requested notification → High priority bubble", async () => {
      const spiritEvent = notificationToSpiritEvent({
        reason: "review_requested",
        subject: { title: "Fix Docker rate limits", type: "PullRequest" },
        repository: { full_name: "rancher/local-path-provisioner" },
      });

      const result = await route(spiritEvent, skills);
      expect(result.message).toBe("High priority: PullRequest in rancher/local-path-provisioner");
      expect(result.mood).toBe("alert");
    });

    it("mention notification → High priority bubble", async () => {
      const spiritEvent = notificationToSpiritEvent({
        reason: "mention",
        subject: { title: "PR review request from Lily", type: "Issue" },
        repository: {
          full_name: "abigailliang-aks-sig-node/test-notification",
        },
      });

      const result = await route(spiritEvent, skills);
      expect(result.message).toContain("High priority");
      expect(result.mood).toBe("alert");
    });

    it("subscribed notification → normal bubble", async () => {
      const spiritEvent = notificationToSpiritEvent({
        reason: "subscribed",
        subject: { title: "Weekly sync", type: "Discussion" },
        repository: { full_name: "team/meetings" },
      });

      const result = await route(spiritEvent, skills);
      expect(result.message).toBe("📬 Weekly sync");
      expect(result.mood).toBe("alert");
    });

    it("webhook PR review → High priority bubble", async () => {
      const spiritEvent = githubToSpiritEvent("pull_request", {
        action: "review_requested",
        pull_request: { title: "Add unit tests" },
        sender: { login: "Lily" },
      });

      const result = await route(spiritEvent, skills);
      expect(result.message).toContain("High priority");
      expect(result.message).toContain("Lily asked you to review: Add unit tests");
      expect(result.mood).toBe("alert");
    });
  });
});
