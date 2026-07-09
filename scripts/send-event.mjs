#!/usr/bin/env node

// Usage: node scripts/send-event.mjs <type> [payload-json]
// Examples:
//   node scripts/send-event.mjs notification.received '{"title":"PR review request","body":"Lily asked you to review a PR"}'
//   node scripts/send-event.mjs message.received '{"from":"Bob","text":"Hey!"}'
//   node scripts/send-event.mjs pet.clicked

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const inboxPath = resolve(process.cwd(), ".project-spirit/inbox.json");

const type = process.argv[2];
if (!type) {
  console.error("Usage: node scripts/send-event.mjs <type> [payload-json]");
  process.exit(1);
}

const payload = process.argv[3] ? JSON.parse(process.argv[3]) : undefined;
const event = payload ? { type, payload } : { type };

let inbox = [];
if (existsSync(inboxPath)) {
  try {
    inbox = JSON.parse(readFileSync(inboxPath, "utf-8"));
  } catch {
    inbox = [];
  }
}

inbox.push(event);
writeFileSync(inboxPath, JSON.stringify(inbox, null, 2));
console.log(`✓ Sent event: ${type}`, payload ? payload : "");
