import "./ContextMenu.css";

interface ContextMenuProps {
  onSleep: () => void;
  onWake: () => void;
  onHistory: () => void;
  onRecap: () => void;
  onQuit: () => void;
}

export default function ContextMenu({
  onSleep,
  onWake,
  onHistory,
  onRecap,
  onQuit,
}: ContextMenuProps) {
  return (
    <div className="context-menu">
      <button onClick={onHistory}>History</button>
      <button onClick={onRecap}>AI Recap</button>
      <button onClick={onSleep}>Sleep</button>
      <button onClick={onWake}>Wake up</button>
      <button onClick={onQuit}>Quit</button>
    </div>
  );
}
