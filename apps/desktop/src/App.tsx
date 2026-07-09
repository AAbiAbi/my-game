import { useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { dispatch } from "../../../packages/core/src/dispatcher";
import { helloSkill } from "../../../packages/skills/helloSkill";
import "./App.css";

const skills = [helloSkill];

export default function App() {
  const [bubble, setBubble] = useState("");
  const [mood, setMood] = useState<"idle" | "happy" | "alert">("idle");
  const dragRef = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  async function handlePetClick() {
    if (dragRef.current) return;

    const result = await dispatch({ type: "pet.clicked" }, skills);

    setBubble(result.message);
    setMood(result.mood ?? "idle");

    setTimeout(() => {
      setBubble("");
      setMood("idle");
    }, 2000);
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

  return (
    <div className="pet-root" data-tauri-drag-region>
      {bubble && <div className="bubble">{bubble}</div>}

      <button
        className={`pet pet-${mood}`}
        onClick={handlePetClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        🐱
      </button>
    </div>
  );
}
