import { app } from "@azure/functions";
import { WebPubSubServiceClient } from "@azure/web-pubsub";
import crypto from "crypto";

// --- negotiate ---
app.http("negotiate", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "negotiate",
  handler: async () => {
    const cs = process.env.PUBSUB_CONNECTION_STRING;
    if (!cs) {
      return { status: 500, body: "PUBSUB_CONNECTION_STRING not configured" };
    }

    const client = new WebPubSubServiceClient(cs, "spirit");
    const { url } = await client.getClientAccessToken({
      userId: "desktop-pet",
      expirationTimeInMinutes: 60,
    });

    return { jsonBody: { url } };
  },
});

// --- github-webhook (for repos you have admin on) ---
app.http("github-webhook", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "github-webhook",
  handler: async (request) => {
    const cs = process.env.PUBSUB_CONNECTION_STRING;
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!cs) {
      return { status: 500, body: "PUBSUB_CONNECTION_STRING not configured" };
    }

    const body = await request.text();

    // Verify GitHub signature
    if (secret) {
      const signature = request.headers.get("x-hub-signature-256");
      const expected =
        "sha256=" +
        crypto.createHmac("sha256", secret).update(body).digest("hex");
      if (signature !== expected) {
        return { status: 401, body: "Invalid signature" };
      }
    }

    const payload = JSON.parse(body);
    const eventType = request.headers.get("x-github-event");

    const event = githubToSpiritEvent(eventType, payload);
    if (!event) {
      return { status: 200, body: "Event ignored" };
    }

    const pubsub = new WebPubSubServiceClient(cs, "spirit");
    await pubsub.sendToAll(event, { contentType: "application/json" });

    return { status: 200, body: "OK" };
  },
});

// --- github-poll (for repos you don't have admin on) ---
app.timer("github-poll", {
  schedule: "0 */1 * * * *", // every 1 minute
  handler: async (timer, context) => {
    const cs = process.env.PUBSUB_CONNECTION_STRING;
    const token = process.env.GITHUB_TOKEN;

    if (!cs || !token) {
      context.log("Missing PUBSUB_CONNECTION_STRING or GITHUB_TOKEN");
      return;
    }

    // Fetch unread notifications from GitHub
    const res = await fetch("https://api.github.com/notifications", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!res.ok) {
      context.log(`GitHub API error: ${res.status} ${res.statusText}`);
      return;
    }

    const notifications = await res.json();

    if (notifications.length === 0) {
      return;
    }

    context.log(`${notifications.length} new notification(s)`);

    const pubsub = new WebPubSubServiceClient(cs, "spirit");

    for (const n of notifications) {
      const event = notificationToSpiritEvent(n);
      if (event) {
        await pubsub.sendToAll(event, { contentType: "application/json" });
        context.log(`  → ${event.payload.title}`);
      }
    }

    // Mark as read
    await fetch("https://api.github.com/notifications", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  },
});

function notificationToSpiritEvent(n) {
  const { reason, subject, repository } = n;
  const title = subject?.title;
  const repo = repository?.full_name;
  const type = subject?.type;

  const highPriority = ["review_requested", "assign", "mention"].includes(reason);

  return {
    type: "notification.received",
    payload: {
      title: highPriority ? `[${reason}] ${title}` : title,
      body: `${type} in ${repo}`,
    },
  };
}

function githubToSpiritEvent(eventType, payload) {
  switch (eventType) {
    case "pull_request": {
      const action = payload.action;
      const pr = payload.pull_request;
      const sender = payload.sender?.login;
      if (action === "review_requested") {
        return {
          type: "notification.received",
          payload: {
            title: "PR review request",
            body: `${sender} asked you to review: ${pr.title}`,
          },
        };
      }
      if (["opened", "closed", "merged"].includes(action)) {
        return {
          type: "notification.received",
          payload: { title: `PR ${action}`, body: `${sender}: ${pr.title}` },
        };
      }
      return null;
    }

    case "issues": {
      const issue = payload.issue;
      const sender = payload.sender?.login;
      if (["assigned", "mentioned"].includes(payload.action)) {
        return {
          type: "notification.received",
          payload: {
            title: `Issue ${payload.action}`,
            body: `${sender}: ${issue.title}`,
          },
        };
      }
      return null;
    }

    case "push": {
      const repo = payload.repository?.full_name;
      const pusher = payload.pusher?.name;
      const commits = payload.commits?.length || 0;
      return {
        type: "notification.received",
        payload: {
          title: `Push to ${repo}`,
          body: `${pusher} pushed ${commits} commit(s)`,
        },
      };
    }

    default:
      return null;
  }
}
