import { describe, it, expect, vi } from "vitest";

// Mock the @tauri-apps/plugin-sql module
const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock("@tauri-apps/plugin-sql", () => ({
  default: {
    load: vi.fn().mockResolvedValue({
      execute: mockExecute,
      select: mockSelect,
    }),
  },
}));

// Import after mock
const { initDb, saveEvent, getHistory } = await import("../apps/desktop/src/db");

describe("DB module", () => {
  it("initDb creates table", async () => {
    await initDb();
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("CREATE TABLE IF NOT EXISTS events"),
    );
  });

  it("saveEvent inserts with correct params", async () => {
    mockExecute.mockClear();
    mockSelect.mockResolvedValueOnce([]); // dedup check returns empty
    await saveEvent(
      "notification.received",
      "[mention] Fix bug",
      "Issue in org/repo",
      "alert",
      "high",
      "websocket",
    );

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO events"),
      expect.arrayContaining([
        expect.any(Number), // ts
        "notification.received",
        "[mention] Fix bug",
        "Issue in org/repo",
        "alert",
        "high",
        "shown", // high priority → status "shown"
        "websocket",
      ]),
    );
  });

  it("saveEvent sets status to digest_pending for low priority", async () => {
    mockExecute.mockClear();
    mockSelect.mockResolvedValueOnce([]); // dedup check returns empty
    await saveEvent(
      "notification.received",
      "Release v2.0",
      "Release in Azure/AgentBaker",
      "alert",
      "low",
      "github-poll",
    );

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO events"),
      expect.arrayContaining(["digest_pending"]),
    );
  });

  it("getHistory returns events in DESC order", async () => {
    const mockEvents = [
      { id: 2, ts: 2000, title: "newer", priority: "high" },
      { id: 1, ts: 1000, title: "older", priority: "low" },
    ];
    mockSelect.mockResolvedValueOnce(mockEvents);

    const result = await getHistory(10);
    expect(result).toEqual(mockEvents);
    expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining("ORDER BY ts DESC"), [10]);
  });

  it("getHistory defaults to limit 50", async () => {
    mockSelect.mockResolvedValueOnce([]);
    await getHistory();
    expect(mockSelect).toHaveBeenCalledWith(expect.any(String), [50]);
  });

  it("saveEvent skips duplicate within 5 minutes", async () => {
    mockExecute.mockClear();
    mockSelect.mockResolvedValueOnce([{ id: 99 }]); // dedup finds existing
    const saved = await saveEvent(
      "notification.received",
      "[mention] Fix bug",
      "Issue in org/repo",
      "alert",
      "high",
      "websocket",
    );

    expect(saved).toBe(false);
    expect(mockExecute).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT"),
      expect.anything(),
    );
  });
});
