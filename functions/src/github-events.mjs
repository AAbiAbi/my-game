// GitHub event to SpiritEvent conversion logic
// Extracted for testability

export function notificationToSpiritEvent(n) {
  const { reason, subject, repository } = n;
  const title = subject?.title;
  const repo = repository?.full_name;
  const type = subject?.type;

  const highPriority = ["review_requested", "assign", "mention"].includes(
    reason,
  );

  return {
    type: "notification.received",
    payload: {
      title: highPriority ? `[${reason}] ${title}` : title,
      body: `${type} in ${repo}`,
    },
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

    default:
      return null;
  }
}
