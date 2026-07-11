import { describe, it, expect, vi } from "vitest";

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

const { initDb, saveEvent, getHistory, markSummarized, saveDigest } =
  await import("../apps/desktop/src/db");

describe("DB module (two-table schema)", () => {
  it("initDb creates both tables", async () => {
    await initDb();
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("CREATE TABLE IF NOT EXISTS events"),
    );
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("CREATE TABLE IF NOT EXISTS digests"),
    );
  });

  it("saveEvent inserts with correct fields", async () => {
    mockExecute.mockClear();
    mockSelect.mockResolvedValueOnce([]); // dedup check
    await saveEvent({
      source: "websocket",
      event_type: "notification.received",
      repo: "Azure/AgentBaker",
      title: "[mention] Fix bug",
      body: "Issue in repo",
      relevance: "direct",
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO events"),
      expect.arrayContaining([
        "websocket",
        "notification.received",
        "Azure/AgentBaker",
        "[mention] Fix bug",
        "Issue in repo",
        "direct",
        "shown",
      ]),
    );
  });

  it("saveEvent sets status to digest_pending for digest relevance", async () => {
    mockExecute.mockClear();
    mockSelect.mockResolvedValueOnce([]); // dedup
    await saveEvent({
      source: "github-poll",
      event_type: "notification.received",
      repo: "Azure/AgentBaker",
      title: "Release v2.0",
      relevance: "digest",
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO events"),
      expect.arrayContaining(["digest_pending"]),
    );
  });

  it("saveEvent skips duplicate within 5 minutes", async () => {
    mockExecute.mockClear();
    mockSelect.mockResolvedValueOnce([{ id: "existing-id" }]); // dedup finds match
    const saved = await saveEvent({
      source: "websocket",
      event_type: "notification.received",
      title: "[mention] Fix bug",
      relevance: "direct",
    });

    expect(saved).toBe(false);
    expect(mockExecute).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO events"),
      expect.anything(),
    );
  });

  it("getHistory returns events excluding ignored", async () => {
    const mockEvents = [
      { id: "2", title: "newer", relevance: "direct", created_at: "2026-07-10T10:00:00Z" },
      { id: "1", title: "older", relevance: "digest", created_at: "2026-07-10T09:00:00Z" },
    ];
    mockSelect.mockResolvedValueOnce(mockEvents);

    const result = await getHistory(10);
    expect(result).toEqual(mockEvents);
    expect(mockSelect).toHaveBeenCalledWith(
      expect.stringContaining("relevance != 'ignored'"),
      [10],
    );
  });

  it("markSummarized updates status for given ids", async () => {
    mockExecute.mockClear();
    await markSummarized(["id-1", "id-2", "id-3"]);
    expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining("status = 'summarized'"), [
      "id-1",
      "id-2",
      "id-3",
    ]);
  });

  it("saveDigest inserts into digests table", async () => {
    mockExecute.mockClear();
    await saveDigest("Summary text", 5, "2026-07-10T08:00:00Z", "2026-07-10T17:00:00Z");
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO digests"),
      expect.arrayContaining(["Summary text", 5, "2026-07-10T08:00:00Z", "2026-07-10T17:00:00Z"]),
    );
  });
});
