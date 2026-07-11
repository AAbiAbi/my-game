import { useEffect, useState } from "react";
import { getHistory, type EventRecord } from "./db";
import "./HistoryPanel.css";

interface HistoryPanelProps {
  onClose: () => void;
}

export default function HistoryPanel({ onClose }: HistoryPanelProps) {
  const [events, setEvents] = useState<EventRecord[]>([]);

  useEffect(() => {
    getHistory(30).then((data) => {
      setEvents(data);
    });
  }, []);

  function formatTime(isoStr: string): string {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="history-wrapper">
      <div className="history-header">
        <span>History</span>
        <button className="history-close-btn" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="history-list">
        {events.length === 0 && <div className="history-empty">No events yet</div>}
        {events.map((e) => (
          <div key={e.id} className={`history-item relevance-${e.relevance}`}>
            <div className="history-time">{formatTime(e.created_at)}</div>
            <div className="history-content">
              <div className="history-title">{e.title}</div>
              {e.body && <div className="history-body">{e.body}</div>}
              {e.repo && <div className="history-repo">{e.repo}</div>}
            </div>
            {e.relevance === "direct" && <span className="history-badge">⚡</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
