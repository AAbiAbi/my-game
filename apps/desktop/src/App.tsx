import { useState } from "react";
import { dispatch } from "../../../packages/core/src/dispatcher";
import { helloSkill } from "../../../packages/skills/helloSkill";
import "./App.css";

const skills = [helloSkill];

export default function App() {
  const [bubble, setBubble] = useState("");
  const [mood, setMood] = useState<"idle" | "happy" | "alert">("idle");

  async function handlePetClick() {
    const result = await dispatch({ type: "pet.clicked" }, skills);

    setBubble(result.message);
    setMood(result.mood ?? "idle");

    setTimeout(() => {
      setBubble("");
      setMood("idle");
    }, 2000);
  }

  return (
    <div className="pet-root">
      {bubble && <div className="bubble">{bubble}</div>}

      <button className={`pet pet-${mood}`} onClick={handlePetClick}>
        🐱
      </button>
    </div>
  );
}
