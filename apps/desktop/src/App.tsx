import { useEffect, useRef, useState, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { route } from "../../../packages/core/src/router";
import { logger, setLogLevel } from "../../../packages/core/src/logger";
import { defaultPreferences, type Preferences } from "../../../packages/core/src/preferences";
import { skills } from "./skills";
import { useDrag } from "./hooks/useDrag";
import { usePetStateMachine } from "./hooks/usePetStateMachine";
import { loadPreferences } from "./loadPreferences";
import { connectWebSocket, disconnectWebSocket } from "./websocket";
import { initDb, saveEvent, getDigestPending, markSummarized, saveDigest } from "./db";
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
  const { state: mood, send } = usePetStateMachine(prefs.defaultMood, prefs.bubbleDurationMs);
  const moodRef = useRef(mood);
  moodRef.current = mood;
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
        const result = await route(event, skills);
        const title = event.type === "notification.received" ? (event.payload?.title ?? "") : "";
        const body = event.type === "notification.received" ? (event.payload?.body ?? "") : "";
        const priorityRaw = (event.payload as Record<string, unknown>)?.priority;
        const priority: "high" | "low" = priorityRaw === "low" ? "low" : "high";
        const repo = (event.payload as Record<string, unknown>)?.repo as string | undefined;

        // Save ALL events to local SQLite (even when sleeping)
        await saveEvent({
          source: "websocket",
          event_type: event.type,
          repo,
          title: title || result.message,
          body,
          relevance: priority === "high" ? "direct" : "digest",
        });

        // Sleeping: record but don't show bubbles
        if (moodRef.current === "sleeping") return;

        // Local filter: only show bubble for high priority
        if (priority === "high") {
          send({ type: "IMPORTANT_NOTIFICATION" });
          addBubble(result.message);
        } else {
          logger.info(`[LOW] Stored for digest: ${title}`);
        }
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

    send({ type: "USER_CLICK" });
    addBubble(result.message);
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    rightClicked.current = true;
    setMenuOpen((v) => !v);
    setHistoryOpen(false);
  }

  function sleep() {
    logger.info("Pet going to sleep");
    send({ type: "SLEEP" });
    setMenuOpen(false);
    addBubble("Going to sleep...");
  }

  function wakeUp() {
    logger.info("Pet waking up");
    send({ type: "WAKE_UP" });
    setMenuOpen(false);
    addBubble("I'm awake!");
  }

  async function openHistory() {
    setMenuOpen(false);
    setHistoryOpen(true);
  }

  function closeHistory() {
    setHistoryOpen(false);
  }

  const RECAP_URL =
    import.meta.env.VITE_RECAP_URL || "https://spirit-functions.azurewebsites.net/api/recap";

  async function handleRecap() {
    setMenuOpen(false);
    addBubble("🤖 Generating recap...");

    const pending = await getDigestPending();
    if (pending.length === 0) {
      addBubble("No new events to recap.");
      return;
    }

    try {
      const res = await fetch(RECAP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: pending.map((e) => ({
            title: e.title,
            body: e.body,
            repo: e.repo,
          })),
        }),
      });

      const { summary, eventCount } = await res.json();

      // Mark events as summarized
      await markSummarized(pending.map((e) => e.id));

      // Save digest to DB
      const periodStart = pending[0].created_at;
      const periodEnd = pending[pending.length - 1].created_at;
      await saveDigest(summary, eventCount, periodStart, periodEnd);

      // Show summary as bubble
      addBubble(`📊 Recap (${eventCount} events): ${summary.substring(0, 150)}...`);
      logger.info(`AI Recap: ${eventCount} events summarized`);
    } catch (err) {
      logger.error("Recap failed:", err);
      addBubble("❌ Recap failed. Try again later.");
    }
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
      {historyOpen && <HistoryPanel onClose={closeHistory} />}
      {menuOpen && (
        <ContextMenu
          onSleep={sleep}
          onWake={wakeUp}
          onHistory={openHistory}
          onRecap={handleRecap}
          onQuit={quit}
        />
      )}
      <button
        className={`pet pet-${mood}`}
        onClick={handlePetClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        {mood === "sleeping" ? "😴" : mood === "happy" ? "😸" : mood === "alert" ? "🙀" : "🐱"}
      </button>
    </div>
  );
}
