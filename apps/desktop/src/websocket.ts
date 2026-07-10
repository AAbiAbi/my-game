import { WebPubSubClient } from "@azure/web-pubsub-client";
import { logger } from "../../../packages/core/src/logger";
import type { SpiritEvent } from "../../../packages/core/src/events";

type OnEventCallback = (event: SpiritEvent) => void;

let client: WebPubSubClient | null = null;

export function connectWebSocket(url: string, onEvent: OnEventCallback) {
  if (client) {
    client.stop();
  }

  logger.info("WebSocket: connecting via PubSub client SDK...");

  client = new WebPubSubClient(url);

  client.on("connected", () => {
    logger.info("WebSocket: connected");
  });

  client.on("server-message", (e) => {
    try {
      const data = typeof e.message.data === "string" ? JSON.parse(e.message.data) : e.message.data;
      logger.debug("WebSocket: received", data);
      onEvent(data as SpiritEvent);
    } catch (err) {
      logger.error("WebSocket: failed to parse message", err);
    }
  });

  client.on("disconnected", () => {
    logger.warn("WebSocket: disconnected");
  });

  client.on("stopped", () => {
    logger.info("WebSocket: stopped");
  });

  client.start().catch((err) => {
    logger.error("WebSocket: failed to start", err);
  });
}

export function disconnectWebSocket() {
  if (client) {
    client.stop();
    client = null;
  }
}
