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
import ContextMenu from "./ContextMenu";
import "./App.css";

interface BubbleMessage {
  id: number;
  text: string;
}

let nextId = 0;

export default function App() {
  if (import.meta.env.DEV) setLogLevel("debug");
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);
  const [bubbles, setBubbles] = useState<BubbleMessage[]>([]);
  const [mood, setMood] = useState<PetMood>(prefs.defaultMood);
  const [menuOpen, setMenuOpen] = useState(false);
  const rightClicked = useRef(false);
  const { isDragging, handleMouseDown, handleMouseUp } = useDrag();

  useEffect(() => {
    loadPreferences().then(setPrefs);
  }, []);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_PUBSUB_URL;
    if (!wsUrl) {
      logger.warn("No VITE_PUBSUB_URL set, skipping WebSocket connection");
      return;
    }
    connectWebSocket(wsUrl, async (event) => {
      if (mood === "sleeping") return;
      const result = await route(event, skills);
      setMood(result.mood ?? "idle");
      addBubble(result.message);
    });
    return () => disconnectWebSocket();
  }, []);

  const addBubble = useCallback(
    (message: string) => {
      const id = nextId++;
      setBubbles((prev) => [...prev, { id, text: message }]);

      // Auto-remove after duration
      setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== id));
      }, prefs.bubbleDurationMs);
    },
    [prefs.bubbleDurationMs],
  );

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

  async function quit() {
    logger.info("Quitting app");
    await getCurrentWindow().close();
  }

  return (
    <div className="pet-root" data-tauri-drag-region>
      <div className="bubble-stack">
        {bubbles.map((b) => (
          <div key={b.id} className="bubble bubble-enter">
            {b.text}
          </div>
        ))}
      </div>
      {menuOpen && <ContextMenu onSleep={sleep} onWake={wakeUp} onQuit={quit} />}
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
