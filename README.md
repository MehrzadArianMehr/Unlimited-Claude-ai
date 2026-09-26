Mehrzad ArianMehr©
# Unlimited Claude — AI Chat

A Claude-like AI chat web app with an Apple-style interface. Start a new chat,
browse your history, attach images for AI vision analysis, generate images
and videos with built-in skills, and sign in with your Puter account for free
unlimited AI.

Built with **Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui + Prisma
(SQLite) + Zustand + Framer Motion + z-ai-web-dev-sdk**.

---

## Quick start

### Option A — Use a launcher (easiest)

1. **Install Bun** from <https://bun.sh> (required, ~10 seconds to install).
2. Double-click the launcher for your OS:
   - **Windows:** `start-windows.bat`
   - **macOS:** `start-mac.command`
   - **Linux:** `start-linux.sh` (run `./start-linux.sh` in a terminal, or
     right-click → "Run" in your file manager)
   *(On macOS the first time you may need to right-click → "Open" to bypass
   Gatekeeper. On Linux, if double-click doesn't run it, run
   `chmod +x start-linux.sh && ./start-linux.sh` in a terminal.)*
3. The launcher installs dependencies, sets up the database, starts the server,
   and opens `http://localhost:3000` in your browser.

### Option B — Manual

```bash
bun install        # install dependencies
bun run db:push    # create the SQLite database
bun run dev        # start the dev server on http://localhost:3000
```

---

## Features

- 💬 **Multi-turn AI chat** with markdown rendering + auto-generated chat titles
- 🖼️ **Image attachments** — upload an image and the AI (VLM) describes it
- ✨ **Skills** — generate images (`/image <prompt>`) and videos
  (`/video <prompt>`) inline; toggle them in the **Skills** panel (✨ button)
- 🗂️ **Chat history** grouped by **Pinned / Today / Yesterday / Previous 7
  days / Older**; search, pin, rename, delete, export as Markdown
- ✏️ **Edit & regenerate** — edit any user message (the AI re-replies);
  regenerate the last AI reply
- 🔐 **Puter login** — sign in with your [Puter](https://puter.com) account
  for free unlimited AI (bottom of the sidebar)
- 🌗 **Dark / light mode**, fully responsive, Apple-style translucent materials
  + spring animations
- ⌨️ **Keyboard shortcuts** — `⌘K` / `Ctrl+K` = new chat, `⌘/` / `Ctrl+/` =
  focus search
- ♿ Reduced-motion, reduced-transparency, and high-contrast support

---

## Skills

| Skill | Command | What it does |
|-------|---------|--------------|
| 🍌 Nano Banana Prompting | `/image <prompt>` | AI image generation |
| 🎬 Seedance 2.5 Prompts | `/video <prompt>` | AI video generation |
| 🔌 Seedance 2.5 OpenAPI | `/video <prompt>` | Programmatic video API (same backend) |

All three are **enabled by default**. Toggle them in the Skills panel (✨ in
the sidebar header). Type the slash command in the chat input and press Enter.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) + Framer Motion |
| Database | Prisma ORM + SQLite |
| State | Zustand (client) + TanStack Query (server) |
| AI | z-ai-web-dev-sdk — LLM chat, VLM vision, image + video generation |
| Auth | Puter.js (puter.com) for free unlimited AI |

---

## Project structure

```
.
├── start-windows.bat        # Windows launcher
├── start-mac.command        # macOS launcher
├── start-linux.sh           # Linux launcher
├── package.json
├── prisma/schema.prisma      # Profile, Chat, Message models
├── public/uploads/          # generated images / uploaded files
└── src/
    ├── app/
    │   ├── page.tsx         # the single user-visible route
    │   ├── layout.tsx       # theme + puter.js script
    │   └── api/             # REST endpoints (chats, messages, upload, skills, profile)
    ├── components/chat/     # sidebar, chat-area, message-bubble, skills-panel, puter-account-card
    ├── hooks/               # use-puter-auth
    └── lib/                 # chat-store (Zustand), llm, skills-registry, motion-presets, ...
```

---

## Notes

- The app uses a single local SQLite database (`db/custom.db`). All your chats
  and messages are stored there.
- Image / video generation uses the `z-ai` CLI under the hood (the SDK's image
  method hangs in the Next.js runtime; the CLI is reliable). Image generation
  takes ~10–40s; video takes longer (async task + polling).
- Puter sign-in opens a popup to puter.com; your puter username is synced to
  your local profile.

Enjoy! 🚀
