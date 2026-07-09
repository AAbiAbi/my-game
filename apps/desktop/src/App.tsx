import { useEffect, useRef, useState } from "react";
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
import { pollInbox } from "./inbox";
import ContextMenu from "./ContextMenu";
import "./App.css";

export default function App() {
  // Set debug level in dev mode
  if (import.meta.env.DEV) setLogLevel("debug");
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);
  const [bubble, setBubble] = useState("");
  const [mood, setMood] = useState<PetMood>(prefs.defaultMood);
  const [menuOpen, setMenuOpen] = useState(false);
  const bubbleTimer = useRef<number>(undefined);
  const rightClicked = useRef(false);
  const { isDragging, handleMouseDown, handleMouseUp } = useDrag();

  useEffect(() => {
    loadPreferences().then(setPrefs);
  }, []);

  // Poll inbox every 3 seconds for external events
  useEffect(() => {
    const interval = setInterval(async () => {
      if (mood === "sleeping") return;
      const events = await pollInbox();
      for (const event of events) {
        const result = await route(event, skills);
        setMood(result.mood ?? "idle");
        showBubble(result.message);
      }
    }, 3000);
    return () => clearInterval(interval);
  });

  function showBubble(message: string) {
    clearTimeout(bubbleTimer.current);
    setBubble(message);
    bubbleTimer.current = setTimeout(() => setBubble(""), prefs.bubbleDurationMs);
  }

  async function handlePetClick() {
    if (isDragging.current) return;
    if (rightClicked.current) {
      rightClicked.current = false;
      return;
    }
    if (mood === "sleeping") {
      showBubble(`Zzz... ${prefs.petName} is sleeping.`);
      return;
    }
    const result = await route({ type: "pet.clicked" }, skills);

    setMood(result.mood ?? "happy");
    showBubble(result.message);

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
    showBubble("Going to sleep...");
  }

  function wakeUp() {
    logger.info("Pet waking up");
    setMood("idle");
    setMenuOpen(false);
    showBubble("I'm awake!");
  }

  async function quit() {
    logger.info("Quitting app");
    await getCurrentWindow().close();
  }

  return (
    <div className="pet-root" data-tauri-drag-region>
      {bubble && <div className="bubble">{bubble}</div>}
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
