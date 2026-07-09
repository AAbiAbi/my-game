# Abby AI Companion — Desktop Pet

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Desktop Pet (Tauri)                            │
│                                                                             │
│  🐱 Character          Notification         Chat UI         Voice (future)   │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                         ▲
                    ▼                         │
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Local Agent (TypeScript)                           │
│                                                                             │
│  Event Router        Skills Engine         Local Memory                      │
│  ├── pet.clicked     ├── helloSkill        ├── preferences.json              │
│  ├── notification    ├── notificationSkill └── .project-spirit/              │
│  └── message         └── messageSkill                                        │
│                                                                             │
│  Logger (debug/info/warn/error)                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
npm install
npm run tauri dev     # launch desktop pet
```

## Scripts

| Command                                 | Description                 |
| --------------------------------------- | --------------------------- |
| `npm run dev`                           | Vite dev server (port 3000) |
| `npm run tauri dev`                     | Launch Tauri desktop app    |
| `npm test`                              | Run all unit tests          |
| `npm test -- <file>`                    | Run specific test file      |
| `npm test -- <file> --reporter=verbose` | Run with full log output    |
| `npm run test:watch`                    | Watch mode                  |
| `npm run lint`                          | ESLint check                |
| `npm run fmt`                           | Prettier format             |

## Project Structure

```
apps/desktop/src/
  App.tsx              — main UI + state
  ContextMenu.tsx      — right-click menu (Sleep/Wake/Quit)
  hooks/useDrag.ts     — window drag logic
  skills.ts            — skill registry
  loadPreferences.ts   — read .project-spirit/preferences.json

packages/core/src/
  router.ts            — event → skill matching
  events.ts            — typed event definitions
  skill.ts             — Skill interface
  preferences.ts       — Preferences type + defaults
  logger.ts            — leveled logger (debug/info/warn/error)

packages/skills/
  helloSkill.ts        — pet.clicked → "Hi Abby!"
  notificationSkill.ts — notification.received → priority detection
  messageSkill.ts      — message.received → "💬 from: text"

tests/
  e2e.integration.test.ts — full event→router→skill integration test
```

## Event System

```
SpiritEvent → route(event, skills) → first matching skill → SkillResult → bubble
```

| Event                            | Skill             | Result                  |
| -------------------------------- | ----------------- | ----------------------- |
| `pet.clicked`                    | helloSkill        | "Hi Abby!" 😊           |
| `notification.received` (review) | notificationSkill | "High priority: ..." ⚠️ |
| `notification.received` (other)  | notificationSkill | "📬 {title}" ⚠️         |
| `message.received`               | messageSkill      | "💬 {from}: {text}" 😊  |

## Preferences

Config file: `.project-spirit/preferences.json` (project root, gitignored)

```json
{
  "petName": "Abby",
  "defaultMood": "idle",
  "bubbleDurationMs": 2000
}
```

Edit and restart to apply changes.

## Dev Tooling

- **Vite** + **React** + **Tauri** — desktop app stack
- **Vitest** — unit + integration tests
- **ESLint** + **Prettier** — code quality
- **Husky** + **lint-staged** — pre-commit: lint + format + test
- **GitHub Actions CI** — lint + format + test on every PR
- **Branch protection** — main requires CI pass

## Releases

- **v0.1.0** — Basic pet: click, drag, transparent window
- **v0.2.0** — Context menu, sleep mode, preferences, event router, logger
