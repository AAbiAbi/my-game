#!/usr/bin/env node

// Sends a message to all connected clients via Azure Web PubSub.
// Usage: node scripts/pubsub-send.mjs <type> [payload-json]
// Requires: PUBSUB_CONNECTION_STRING env var

import { WebPubSubServiceClient } from "@azure/web-pubsub";

const cs = process.env.PUBSUB_CONNECTION_STRING;
if (!cs) {
  console.error("Error: Set PUBSUB_CONNECTION_STRING environment variable");
  process.exit(1);
}

const type = process.argv[2];
if (!type) {
  console.error("Usage: node scripts/pubsub-send.mjs <type> [payload-json]");
  process.exit(1);
}

const payload = process.argv[3] ? JSON.parse(process.argv[3]) : undefined;
const event = payload ? { type, payload } : { type };

const client = new WebPubSubServiceClient(cs, "spirit");
await client.sendToAll(event, { contentType: "application/json" });
console.log(`✓ Sent via Web PubSub: ${type}`, payload ?? "");
