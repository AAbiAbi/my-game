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

```
把网页变成小窗口
固定尺寸，比如 220x220
always on top
透明背景
可拖动
加宠物状态
idle
happy
alert
sleeping
把 bubble 接到 skill result
点击猫猫 → pet.clicked
skill 返回 "Hi Abby!"
UI 显示气泡
```

- [x] 拖动桌宠。

# 目标

是让桌宠不是 hardcode，而是从本地读：

~/.project-spirit/preferences.json

先放最简单内容：

{
"petName": "Abby",
"defaultMood": "idle",
"bubbleDurationMs": 2000
}

然后 UI 里：

气泡从 Hi Abby! 变成 Hi <petName>!
bubble 消失时间用 bubbleDurationMs
启动时 mood 用 defaultMood

这个完成后，你的项目就开始有“个人设置”了。下一步再做 skills.md。
