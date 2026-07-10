import { logger } from "../../../packages/core/src/logger";
import type { SpiritEvent } from "../../../packages/core/src/events";

type OnEventCallback = (event: SpiritEvent) => void;

let ws: WebSocket | null = null;
let reconnectTimer: number | undefined;
let intentionalClose = false;
let currentUrl = "";
let currentCallback: OnEventCallback | null = null;

export function connectWebSocket(url: string, onEvent: OnEventCallback) {
  intentionalClose = false;
  currentUrl = url;
  currentCallback = onEvent;

  if (ws) {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      intentionalClose = true;
      ws.close();
      intentionalClose = false;
    }
    ws = null;
  }

  logger.info("WebSocket: connecting...");
  ws = new WebSocket(url, "json.webpubsub.azure.v1");

  ws.onopen = () => {
    logger.info("WebSocket: connected");
    clearTimeout(reconnectTimer);
  };

  ws.onmessage = (msg) => {
    try {
      const raw = JSON.parse(msg.data);
      logger.debug("WebSocket: raw message", raw);

      // Web PubSub json subprotocol wraps messages
      let event;
      if (raw.type === "message" && raw.dataType === "json") {
        event = raw.data;
      } else if (raw.type === "message" && raw.dataType === "text") {
        event = JSON.parse(raw.data);
      } else if (raw.type === "system") {
        logger.info("WebSocket: system event", raw.event);
        return;
      } else {
        // Direct message (no subprotocol wrapper)
        event = raw;
      }

      logger.debug("WebSocket: parsed event", event);
      onEvent(event);
    } catch (err) {
      logger.error("WebSocket: failed to parse message", err);
    }
  };

  ws.onclose = () => {
    if (intentionalClose) return;
    logger.warn("WebSocket: disconnected, reconnecting in 5s...");
    reconnectTimer = setTimeout(() => {
      if (currentUrl && currentCallback) {
        connectWebSocket(currentUrl, currentCallback);
      }
    }, 5000);
  };

  ws.onerror = (err) => {
    logger.error("WebSocket: error", err);
  };
}

export function disconnectWebSocket() {
  intentionalClose = true;
  clearTimeout(reconnectTimer);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
  ws = null;
}
