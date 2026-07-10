import { useEffect, useRef, useState, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { route } from "../../../packages/core/src/router";
import { logger, setLogLevel } from "../../../packages/core/src/logger";
import {
  defaultPreferences,
  type Preferences,
  type PetMood,
} from "../../../packages/core/src/preferences";
import { skills } from "./skills";
import { useDrag } from "./hooks/useDrag";
import { loadPreferences } from "./loadPreferences";
import { connectWebSocket, disconnectWebSocket } from "./websocket";
import { initDb, saveEvent } from "./db";
import ContextMenu from "./ContextMenu";
import HistoryPanel from "./HistoryPanel";
import "./App.css";

interface BubbleMessage {
  id: number;
  text: string;
}

const MAX_VISIBLE = 3;
let nextId = 0;

const NEGOTIATE_URL =
  import.meta.env.VITE_NEGOTIATE_URL || "https://spirit-functions.azurewebsites.net/api/negotiate";

async function getNegotiateUrl(): Promise<string> {
  try {
    const res = await fetch(NEGOTIATE_URL);
    const { url } = await res.json();
    logger.info("WebSocket: got token from negotiate endpoint");
    return url;
  } catch {
    const fallback = import.meta.env.VITE_PUBSUB_URL || "";
    if (fallback) {
      logger.warn("WebSocket: negotiate failed, using VITE_PUBSUB_URL fallback");
    }
    return fallback;
  }
}

export default function App() {
  if (import.meta.env.DEV) setLogLevel("debug");
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);
  const [queue, setQueue] = useState<BubbleMessage[]>([]);
  const [visible, setVisible] = useState<BubbleMessage[]>([]);
  const [mood, setMood] = useState<PetMood>(prefs.defaultMood);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const rightClicked = useRef(false);
  const { isDragging, handleMouseDown, handleMouseUp } = useDrag();

  const dbReady = useRef(false);

  // Init DB + load preferences on mount
  useEffect(() => {
    initDb()
      .then(() => {
        dbReady.current = true;
      })
      .catch((err) => logger.error("DB init failed:", err));
    loadPreferences().then(setPrefs);
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    async function connect() {
      const wsUrl = await getNegotiateUrl();

      if (!wsUrl) {
        logger.warn("No WebSocket URL available, skipping connection");
        return;
      }

      connectWebSocket(wsUrl, async (event) => {
        if (mood === "sleeping") return;
        const result = await route(event, skills);
        const title = event.type === "notification.received" ? (event.payload?.title ?? "") : "";
        const body = event.type === "notification.received" ? (event.payload?.body ?? "") : "";

        // Save to DB
        await saveEvent(
          event.type,
          title || result.message,
          body,
          result.mood ?? null,
          "high",
          "websocket",
        );

        setMood(result.mood ?? "idle");
        addBubble(result.message);
      });
    }

    connect();
    return () => disconnectWebSocket();
  }, []);

  // Drain queue → visible
  useEffect(() => {
    if (visible.length < MAX_VISIBLE && queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      setVisible((prev) => [...prev, next]);

      setTimeout(() => {
        setVisible((prev) => prev.filter((b) => b.id !== next.id));
      }, prefs.bubbleDurationMs);
    }
  }, [visible, queue, prefs.bubbleDurationMs]);

  const addBubble = useCallback((message: string) => {
    const id = nextId++;
    setQueue((prev) => [...prev, { id, text: message }]);
  }, []);

  async function handlePetClick() {
    if (isDragging.current) return;
    if (rightClicked.current) {
      rightClicked.current = false;
      return;
    }
    if (mood === "sleeping") {
      addBubble(`Zzz... ${prefs.petName} is sleeping.`);
      return;
    }
    const result = await route({ type: "pet.clicked" }, skills);

    setMood(result.mood ?? "happy");
    addBubble(result.message);

    setTimeout(() => setMood("idle"), prefs.bubbleDurationMs);
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    rightClicked.current = true;
    setMenuOpen((v) => !v);
    setHistoryOpen(false);
  }

  function sleep() {
    logger.info("Pet going to sleep");
    setMood("sleeping");
    setMenuOpen(false);
    addBubble("Going to sleep...");
  }

  function wakeUp() {
    logger.info("Pet waking up");
    setMood("idle");
    setMenuOpen(false);
    addBubble("I'm awake!");
  }

  function openHistory() {
    setMenuOpen(false);
    setHistoryOpen(true);
  }

  async function quit() {
    logger.info("Quitting app");
    await getCurrentWindow().close();
  }

  return (
    <div className="pet-root" data-tauri-drag-region>
      <div className="bubble-stack">
        {visible.map((b) => (
          <div key={b.id} className="bubble bubble-enter">
            {b.text}
          </div>
        ))}
      </div>
      {historyOpen && <HistoryPanel onClose={() => setHistoryOpen(false)} />}
      {menuOpen && (
        <ContextMenu onSleep={sleep} onWake={wakeUp} onHistory={openHistory} onQuit={quit} />
      )}
      <button
        className={`pet pet-${mood}`}
        onClick={handlePetClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        {mood === "sleeping" ? "😴" : "🐱"}
      </button>
    </div>
  );
}
