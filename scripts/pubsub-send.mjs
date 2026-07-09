#!/usr/bin/env node

// Sends a message to all connected clients via Azure Web PubSub REST API.
// Usage: node scripts/pubsub-send.mjs <type> [payload-json]
// Example:
//   node scripts/pubsub-send.mjs notification.received '{"title":"PR review request","body":"Lily asked you to review a PR"}'

import crypto from "crypto";

const CONNECTION_STRING = process.env.PUBSUB_CONNECTION_STRING;
if (!CONNECTION_STRING) {
  console.error("Error: Set PUBSUB_CONNECTION_STRING environment variable");
  process.exit(1);
}
const HUB = "spirit";

function parseConnectionString(cs) {
  const parts = {};
  for (const part of cs.split(";")) {
    const [key, ...rest] = part.split("=");
    if (key && rest.length) parts[key] = rest.join("=");
  }
  return parts;
}

function generateServerToken(endpoint, key) {
  const audience = `${endpoint}api/hubs/${HUB}`;
  const exp = Math.floor(Date.now() / 1000) + 300;
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ aud: audience, exp, iat: Math.floor(Date.now() / 1000) })).toString("base64url");
  const signature = crypto
    .createHmac("sha256", Buffer.from(key, "base64"))
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

const type = process.argv[2];
if (!type) {
  console.error("Usage: node scripts/pubsub-send.mjs <type> [payload-json]");
  process.exit(1);
}

const payloadArg = process.argv[3] ? JSON.parse(process.argv[3]) : undefined;
const event = payloadArg ? { type, payload: payloadArg } : { type };

const { Endpoint, AccessKey } = parseConnectionString(CONNECTION_STRING);
const endpoint = Endpoint.endsWith("/") ? Endpoint : `${Endpoint}/`;
const token = generateServerToken(endpoint, AccessKey);

const url = `${endpoint}api/hubs/${HUB}/:send?api-version=2024-01-01`;

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(event),
});

if (res.ok) {
  console.log(`✓ Sent via Web PubSub: ${type}`, payloadArg ?? "");
} else {
  console.error(`✗ Failed (${res.status}):`, await res.text());
}
