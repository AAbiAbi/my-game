#!/usr/bin/env node

// Generates a WebSocket client URL for the desktop pet to connect to Web PubSub.
// Usage: node scripts/negotiate.mjs
// Output: wss://spirit-pubsub.webpubsub.azure.com/client/hubs/spirit?access_token=...

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

function generateToken(endpoint, key, hub, userId = "desktop-pet", ttlMinutes = 60) {
  const audience = `${endpoint}client/hubs/${hub}`;
  const exp = Math.floor(Date.now() / 1000) + ttlMinutes * 60;

  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ aud: audience, sub: userId, exp, iat: Math.floor(Date.now() / 1000) }),
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", Buffer.from(key, "base64"))
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

const { Endpoint, AccessKey } = parseConnectionString(CONNECTION_STRING);
const endpoint = Endpoint.endsWith("/") ? Endpoint : `${Endpoint}/`;
const token = generateToken(endpoint, AccessKey, HUB);
const url = `${endpoint.replace("https://", "wss://")}client/hubs/${HUB}?access_token=${token}`;

console.log(url);
