import { useRef, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

const DRAG_THRESHOLD = 3;

export function useDrag() {
  const dragRef = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = false;
    startPos.current = { x: e.screenX, y: e.screenY };
    getCurrentWindow().startDragging();
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const dx = Math.abs(e.screenX - startPos.current.x);
    const dy = Math.abs(e.screenY - startPos.current.y);
    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      dragRef.current = true;
    }
  }, []);

  return { isDragging: dragRef, handleMouseDown, handleMouseUp };
}
