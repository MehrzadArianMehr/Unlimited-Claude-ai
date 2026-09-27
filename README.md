Mehrzad ArianMehr©

# Unlimited Claude — AI Chat

A Claude-like AI chat web app with an Apple-style interface: start new chats, browse history, attach images for AI vision analysis, generate images and videos with built-in skills, and sign in with Puter for free unlimited AI.

Built with **Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui + Prisma (SQLite) + Zustand + Framer Motion + z-ai-web-dev-sdk**.

## Screenshots

<p align="center">
  <img src="./screenshots/screenshot-1.png" width="45%" />
  <img src="./screenshots/screenshot-2.png" width="45%" />
</p>

## Quick start

**Option A — Launcher (easiest)**

1. Install [Bun](https://bun.sh) (~10 seconds).
2. Run the launcher for your OS:
   - Windows: `start-windows.bat`
   - macOS: `start-mac.command` *(first run: right-click → Open, to bypass Gatekeeper)*
   - Linux: `./start-linux.sh` *(if it won't double-click, run `chmod +x start-linux.sh && ./start-linux.sh`)*
3. It installs dependencies, sets up the database, starts the server, and opens `http://localhost:3000`.

**Option B — Manual**

```bash
bun install        # install dependencies
bun run db:push    # create the SQLite database
bun run dev        # start the dev server on http://localhost:3000
```

## Features

- 💬 Multi-turn AI chat with markdown rendering and auto-generated titles
- 🖼️ Image attachments — the AI describes uploaded images
- ✨ Skills — generate images and videos inline, toggle in the Skills panel
- 🗂️ Chat history grouped by date, with search, pin, rename, delete, and Markdown export
- ✏️ Edit & regenerate — edit any message or regenerate the last reply
- 🔐 Sign in with [Puter](https://puter.com) for free unlimited AI
- 🌗 Dark/light mode, responsive, Apple-style translucent UI with spring animations
- ⌨️ Shortcuts — `⌘K` new chat, `⌘/` focus search
- ♿ Reduced-motion, reduced-transparency, and high-contrast support

## Skills

| Skill | Command | What it does |
|---|---|---|
| 🍌 Nano Banana Prompting | `/image <prompt>` | AI image generation |
| 🎬 Seedance 2.5 Prompts | `/video <prompt>` | AI video generation |
| 🔌 Seedance 2.5 OpenAPI | `/video <prompt>` | Programmatic video API |

All enabled by default — toggle from the ✨ Skills panel.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) + Framer Motion |
| Database | Prisma ORM + SQLite |
| State | Zustand (client) + TanStack Query (server) |
| AI | z-ai-web-dev-sdk — chat, vision, image + video generation |
| Auth | Puter.js for free unlimited AI |

## Project structure

```
.
├── start-windows.bat
├── start-mac.command
├── start-linux.sh
├── package.json
├── prisma/schema.prisma      # Profile, Chat, Message models
├── public/uploads/           # generated images / uploaded files
└── src/
    ├── app/
    │   ├── page.tsx
    │   ├── layout.tsx
    │   └── api/              # chats, messages, upload, skills, profile
    ├── components/chat/
    ├── hooks/
    └── lib/
```

## Notes

- Single local SQLite database (`db/custom.db`) stores all chats and messages.
- Image/video generation runs through the `z-ai` CLI (the SDK's image method hangs in the Next.js runtime, the CLI is reliable). Images take ~10–40s, videos longer (async + polling).
- Puter sign-in opens a popup to puter.com; your Puter username syncs to your local profile.

Enjoy! 🚀
