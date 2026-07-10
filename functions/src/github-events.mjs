// GitHub event to SpiritEvent conversion logic
// Extracted for testability

// Reasons that mean "this is directly about me"
const HIGH_PRIORITY_REASONS = [
  "review_requested",
  "assign",
  "mention",
  "author", // I created it
  "comment", // someone replied to my thread
  "ci_activity", // CI on my PR
];

// Reasons that are ambient repo activity (not pushed, stored for AI recap)
// "subscribed", "manual", "state_change", "team_mention"

/**
 * Convert GitHub notification API response to SpiritEvent.
 * Returns { event, priority } where priority is "high" or "low".
 * High = push to pet immediately. Low = store for AI recap later.
 */
export function notificationToSpiritEvent(n) {
  const { reason, subject, repository } = n;
  const title = subject?.title;
  const repo = repository?.full_name;
  const type = subject?.type;

  const isHighPriority = HIGH_PRIORITY_REASONS.includes(reason);

  return {
    event: {
      type: "notification.received",
      payload: {
        title: isHighPriority ? `[${reason}] ${title}` : title,
        body: `${type} in ${repo}`,
      },
    },
    priority: isHighPriority ? "high" : "low",
    reason,
    repo,
  };
}

export function githubToSpiritEvent(eventType, payload) {
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

    case "issue_comment": {
      const sender = payload.sender?.login;
      const issue = payload.issue;
      const comment = payload.comment;
      const snippet = comment?.body?.substring(0, 80) || "";
      return {
        type: "notification.received",
        payload: {
          title: `Comment on #${issue?.number}`,
          body: `${sender}: ${snippet}`,
        },
      };
    }

    case "pull_request_review": {
      const sender = payload.sender?.login;
      const pr = payload.pull_request;
      const review = payload.review;
      const state = review?.state;
      return {
        type: "notification.received",
        payload: {
          title: `PR review: ${state}`,
          body: `${sender} on: ${pr?.title}`,
        },
      };
    }

    case "pull_request_review_comment": {
      const sender = payload.sender?.login;
      const comment = payload.comment;
      const snippet = comment?.body?.substring(0, 80) || "";
      return {
        type: "notification.received",
        payload: {
          title: `Review comment on PR`,
          body: `${sender}: ${snippet}`,
        },
      };
    }

    default:
      return null;
  }
}
