```
                                    Abby AI Companion
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Desktop Pet (Tauri)                            │
│                                                                             │
│  🐱 Character          Notification         Chat UI         Voice (future)   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                         ▲
                    │                         │
                    ▼                         │
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Local Agent (Rust / Go)                            │
│                                                                             │
│  Skills Engine                                                               │
│  ├── skills.md                                                               │
│  ├── rules.md                                                                │
│  ├── prompts/                                                                 │
│  └── plugins/                                                                 │
│                                                                             │
│  Local Memory                                                                │
│  ├── SQLite                                                                   │
│  ├── Preferences.json                                                         │
│  ├── Cache                                                                    │
│  └── Embeddings (optional)                                                    │
│                                                                             │
│  Event Router                                                                 │
│  ├── Teams Notification                                                       │
│  ├── Outlook / Gmail                                                          │
│  ├── Calendar                                                                 │
│  ├── GitHub                                                                   │
│  └── Local Files                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
        Only send necessary context
                    │
────────────────────┼──────────────────────────────────────────────────────────
                    ▼
                   Azure
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Azure Functions                                   │
│                                                                             │
│  HTTP Trigger                                                               │
│  Timer Trigger                                                              │
│  Queue Trigger (future)                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
          │                 │                     │
          ▼                 ▼                     ▼
┌────────────────┐  ┌─────────────────┐  ┌──────────────────────┐
│ Azure OpenAI   │  │ Azure AI Search │  │ Blob Storage         │
│                │  │                 │  │                      │
│ Summarization  │  │ Knowledge Base  │  │ Optional Documents   │
│ Classification │  │ RAG             │  │ Long-term Storage    │
└────────────────┘  └─────────────────┘  └──────────────────────┘
```

```
project-spirit/

apps/

    desktop/

        src/

            main.tsx      <-- React入口

            App.tsx       <-- UI

packages/

    core/

        dispatcher.ts

        events.ts

        skill.ts

    skills/

        helloSkill.ts
```