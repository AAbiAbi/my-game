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
  固定尺寸，比如 220x220
  always on top
可拖动
加宠物状态
  idle
  happy
  alert
  sleeping
把 bubble 接到 skill result
  点击猫猫 → pet.clicked
  UI 显示气泡
```

真正桌宠化第一步：让窗口像桌宠，而不是网页。

目标：

拖动桌宠。

状态系统 + 右键菜单，这样桌宠开始像一个真正 app。

先做最小版本：

左键点击：显示 Hi Abby!
按住拖动：移动桌宠
右键点击：切换状态 / 退出 app

下一步具体做：

v0.2

- idle / happy / sleeping 三种 mood
- 右键菜单：Sleep / Wake up / Quit
- 气泡提示当前状态

这样完成后，你的桌宠就有：

可互动 + 可移动 + 可退出 + 有状态

然后再接 Azure Function Hello World。
