import { describe, it, expect } from "vitest";
import { notificationToSpiritEvent, githubToSpiritEvent } from "../functions/src/github-events.mjs";
import { route } from "../packages/core/src/router";
import { notificationSkill } from "../packages/skills/notificationSkill";
import { messageSkill } from "../packages/skills/messageSkill";
import { helloSkill } from "../packages/skills/helloSkill";

const skills = [helloSkill, notificationSkill, messageSkill];

describe("E2E: GitHub notification → SpiritEvent → router → skill", () => {
  describe("notificationToSpiritEvent — priority filter", () => {
    it("review_requested → high priority", () => {
      const result = notificationToSpiritEvent({
        reason: "review_requested",
        subject: { title: "Fix auth bug", type: "PullRequest" },
        repository: { full_name: "org/repo" },
      });

      expect(result.priority).toBe("high");
      expect(result.event.type).toBe("notification.received");
      expect(result.event.payload.title).toBe("[review_requested] Fix auth bug");
    });

    it("mention → high priority", () => {
      const result = notificationToSpiritEvent({
        reason: "mention",
        subject: { title: "Need help", type: "Issue" },
        repository: { full_name: "team/project" },
      });

      expect(result.priority).toBe("high");
      expect(result.event.payload.title).toBe("[mention] Need help");
    });

    it("assign → high priority", () => {
      const result = notificationToSpiritEvent({
        reason: "assign",
        subject: { title: "Update docs", type: "Issue" },
        repository: { full_name: "org/docs" },
      });

      expect(result.priority).toBe("high");
      expect(result.event.payload.title).toBe("[assign] Update docs");
    });

    it("author → high priority", () => {
      const result = notificationToSpiritEvent({
        reason: "author",
        subject: { title: "My PR got merged", type: "PullRequest" },
        repository: { full_name: "org/repo" },
      });

      expect(result.priority).toBe("high");
      expect(result.event.payload.title).toBe("[author] My PR got merged");
    });

    it("comment on my thread → high priority", () => {
      const result = notificationToSpiritEvent({
        reason: "comment",
        subject: { title: "Bug report #42", type: "Issue" },
        repository: { full_name: "org/repo" },
      });

      expect(result.priority).toBe("high");
    });

    it("subscribed → low priority (for AI recap)", () => {
      const result = notificationToSpiritEvent({
        reason: "subscribed",
        subject: { title: "Release v2.0", type: "Release" },
        repository: { full_name: "Azure/AgentBaker" },
      });

      expect(result.priority).toBe("low");
      expect(result.event.payload.title).toBe("Release v2.0");
      expect(result.repo).toBe("Azure/AgentBaker");
    });

    it("manual watch → low priority", () => {
      const result = notificationToSpiritEvent({
        reason: "manual",
        subject: { title: "Some PR", type: "PullRequest" },
        repository: { full_name: "Azure/AgentBaker" },
      });

      expect(result.priority).toBe("low");
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
    });

    it("converts issue_comment", () => {
      const event = githubToSpiritEvent("issue_comment", {
        sender: { login: "alice" },
        issue: { number: 42 },
        comment: { body: "This looks good to me!" },
      });

      expect(event.payload.title).toBe("Comment on #42");
      expect(event.payload.body).toContain("alice");
      expect(event.payload.body).toContain("This looks good to me!");
    });

    it("converts pull_request_review", () => {
      const event = githubToSpiritEvent("pull_request_review", {
        sender: { login: "bob" },
        pull_request: { title: "Fix bug" },
        review: { state: "approved" },
      });

      expect(event.payload.title).toBe("PR review: approved");
      expect(event.payload.body).toContain("bob");
    });

    it("converts pull_request_review_comment", () => {
      const event = githubToSpiritEvent("pull_request_review_comment", {
        sender: { login: "carol" },
        pull_request: { title: "Refactor" },
        comment: { body: "Can you add a test for this?" },
      });

      expect(event.payload.title).toBe("Review comment on PR");
      expect(event.payload.body).toContain("carol");
      expect(event.payload.body).toContain("Can you add a test");
    });

    it("ignores unknown event types", () => {
      expect(githubToSpiritEvent("star", { action: "created" })).toBeNull();
    });
  });

  describe("full pipeline: GitHub → filter → router → skill", () => {
    it("high priority notification → push to pet → bubble", async () => {
      const { event, priority } = notificationToSpiritEvent({
        reason: "review_requested",
        subject: { title: "Fix Docker rate limits", type: "PullRequest" },
        repository: { full_name: "rancher/local-path-provisioner" },
      });

      expect(priority).toBe("high");
      const result = await route(event, skills);
      expect(result.message).toBe("High priority: PullRequest in rancher/local-path-provisioner");
      expect(result.mood).toBe("alert");
    });

    it("low priority notification → NOT pushed, stored for recap", async () => {
      const { priority, repo } = notificationToSpiritEvent({
        reason: "subscribed",
        subject: { title: "Weekly release", type: "Release" },
        repository: { full_name: "Azure/AgentBaker" },
      });

      expect(priority).toBe("low");
      expect(repo).toBe("Azure/AgentBaker");
      // Low priority: would NOT be sent to PubSub, stored for AI recap instead
    });

    it("webhook PR review → route → bubble", async () => {
      const event = githubToSpiritEvent("pull_request", {
        action: "review_requested",
        pull_request: { title: "Add unit tests" },
        sender: { login: "Lily" },
      });

      const result = await route(event, skills);
      expect(result.message).toContain("High priority");
      expect(result.message).toContain("Lily asked you to review: Add unit tests");
    });
  });
});
