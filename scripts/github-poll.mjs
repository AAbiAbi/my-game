#!/usr/bin/env node

// GitHubSourceAdapter — polls GitHub notifications and pushes to Web PubSub
// Usage: node scripts/github-poll.mjs [--once]
// Requires: PUBSUB_CONNECTION_STRING env var + gh CLI authenticated

import { execSync } from "child_process";
import { WebPubSubServiceClient } from "@azure/web-pubsub";

const cs = process.env.PUBSUB_CONNECTION_STRING;
if (!cs) {
  console.error("Error: Set PUBSUB_CONNECTION_STRING environment variable");
  process.exit(1);
}

const POLL_INTERVAL_MS = 30_000; // 30 seconds
const once = process.argv.includes("--once");

const pubsub = new WebPubSubServiceClient(cs, "spirit");

function fetchNotifications() {
  try {
    const raw = execSync(
      'gh api notifications --jq \'[.[] | {reason, title: .subject.title, type: .subject.type, repo: .repository.full_name, url: .subject.url}]\'',
      { encoding: "utf-8", timeout: 10000 },
    );
    return JSON.parse(raw || "[]");
  } catch (err) {
    console.error("Failed to fetch notifications:", err.message);
    return [];
  }
}

function toSpiritEvent(notification) {
  const { reason, title, type, repo } = notification;

  // Map GitHub reason to priority
  const highPriority = ["review_requested", "assign", "mention"].includes(reason);

  return {
    type: "notification.received",
    payload: {
      title: highPriority ? `[${reason}] ${title}` : title,
      body: `${type} in ${repo}`,
    },
  };
}

async function poll() {
  const notifications = fetchNotifications();

  if (notifications.length === 0) {
    console.log(`[${new Date().toISOString()}] No new notifications`);
    return;
  }

  console.log(`[${new Date().toISOString()}] ${notifications.length} notification(s)`);

  for (const n of notifications) {
    const event = toSpiritEvent(n);
    await pubsub.sendToAll(event, { contentType: "application/json" });
    console.log(`  → ${event.payload.title}`);
  }

  // Mark as read
  try {
    execSync("gh api -X PUT notifications", { encoding: "utf-8", timeout: 10000 });
  } catch {
    // ignore
  }
}

// Run
await poll();

if (!once) {
  console.log(`Polling every ${POLL_INTERVAL_MS / 1000}s... (Ctrl+C to stop)`);
  setInterval(poll, POLL_INTERVAL_MS);
}
