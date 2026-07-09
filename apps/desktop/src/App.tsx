import { useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { dispatch } from "../../../packages/core/src/dispatcher";
import { helloSkill } from "../../../packages/skills/helloSkill";
import ContextMenu from "./ContextMenu";
import "./App.css";

const skills = [helloSkill];
type Mood = "idle" | "happy" | "sleeping" | "alert";

export default function App() {
  const [bubble, setBubble] = useState("");
  const [mood, setMood] = useState<Mood>("idle");
  const [menuOpen, setMenuOpen] = useState(false);
  const dragRef = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  function showBubble(message: string) {
    setBubble(message);
    setTimeout(() => setBubble(""), 2000);
  }

  async function handlePetClick() {
    if (dragRef.current) return;
    if (mood === "sleeping") {
      showBubble("Zzz... Abby is sleeping.");
      return;
    }
    const result = await dispatch({ type: "pet.clicked" }, skills);

    setMood(result.mood ?? "happy");
    showBubble(result.message);

    setTimeout(() => setMood("idle"), 2000);
  }

  function handleMouseDown(e: React.MouseEvent) {
    dragRef.current = false;
    startPos.current = { x: e.screenX, y: e.screenY };
    getCurrentWindow().startDragging();
  }

  function handleMouseUp(e: React.MouseEvent) {
    const dx = Math.abs(e.screenX - startPos.current.x);
    const dy = Math.abs(e.screenY - startPos.current.y);
    if (dx > 3 || dy > 3) {
      dragRef.current = true;
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setMenuOpen((v) => !v);
  }

  function sleep() {
    setMood("sleeping");
    setMenuOpen(false);
    showBubble("Going to sleep...");
  }

  function wakeUp() {
    setMood("idle");
    setMenuOpen(false);
    showBubble("I'm awake!");
  }

  async function quit() {
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
