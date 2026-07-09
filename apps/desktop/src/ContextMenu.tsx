import "./ContextMenu.css";

interface ContextMenuProps {
  onSleep: () => void;
  onWake: () => void;
  onQuit: () => void;
}

export default function ContextMenu({ onSleep, onWake, onQuit }: ContextMenuProps) {
  return (
    <div className="context-menu">
      <button onClick={onSleep}>Sleep</button>
      <button onClick={onWake}>Wake up</button>
      <button onClick={onQuit}>Quit</button>
    </div>
  );
}
