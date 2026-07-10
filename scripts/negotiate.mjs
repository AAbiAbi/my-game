#!/usr/bin/env node

// Generates a WebSocket client URL for the desktop pet to connect to Web PubSub.
// Usage: node scripts/negotiate.mjs
// Requires: PUBSUB_CONNECTION_STRING env var

import { WebPubSubServiceClient } from "@azure/web-pubsub";

const cs = process.env.PUBSUB_CONNECTION_STRING;
if (!cs) {
  console.error("Error: Set PUBSUB_CONNECTION_STRING environment variable");
  process.exit(1);
}

const client = new WebPubSubServiceClient(cs, "spirit");
const { url } = await client.getClientAccessToken({ userId: "desktop-pet" });
console.log(url);
