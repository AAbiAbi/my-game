import { logger } from "../../../packages/core/src/logger";
import type { SpiritEvent } from "../../../packages/core/src/events";

type OnEventCallback = (event: SpiritEvent) => void;

let ws: WebSocket | null = null;
let reconnectTimer: number | undefined;

export function connectWebSocket(url: string, onEvent: OnEventCallback) {
  if (ws) {
    ws.close();
  }

  logger.info("WebSocket: connecting...");
  ws = new WebSocket(url);

  ws.onopen = () => {
    logger.info("WebSocket: connected");
    clearTimeout(reconnectTimer);
  };

  ws.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      logger.debug("WebSocket: received", data);
      onEvent(data as SpiritEvent);
    } catch (err) {
      logger.error("WebSocket: failed to parse message", err);
    }
  };

  ws.onclose = () => {
    logger.warn("WebSocket: disconnected, reconnecting in 5s...");
    reconnectTimer = setTimeout(() => connectWebSocket(url, onEvent), 5000);
  };

  ws.onerror = (err) => {
    logger.error("WebSocket: error", err);
  };
}

export function disconnectWebSocket() {
  clearTimeout(reconnectTimer);
  if (ws) {
    ws.close();
    ws = null;
  }
}
