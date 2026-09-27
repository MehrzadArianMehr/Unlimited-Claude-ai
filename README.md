Mehrzad ArianMehr©

# Unlimited Claude — AI Chat

A Claude-like AI chat web app with an Apple-style interface: start new chats, browse history, attach images for AI vision analysis, generate images and videos with built-in skills, and sign in with Puter for free unlimited AI.

Built with **Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui + Prisma (SQLite) + Zustand + Framer Motion + z-ai-web-dev-sdk**.

## Screenshots

<p align="center">
<img width="2206" height="1252" alt="Screenshot 2026-09-27 at 03 56 06" src="https://github.com/user-attachments/assets/6c4584df-e01f-4aad-bbf3-6a929bce3b12" />
<img width="2206" height="1252" alt="Screenshot 2026-09-27 at 03 56 18" src="https://github.com/user-attachments/assets/f4aab214-c997-4026-9ac5-4e119af5ee1a" />
<img width="2206" height="1252" alt="Screenshot 2026-09-27 at 03 56 27" src="https://github.com/user-attachments/assets/32e52c41-96c6-46b4-b529-4fcaf3080294" />
<img width="2206" height="1252" alt="Screenshot 2026-09-27 at 03 56 52" src="https://github.com/user-attachments/assets/dfb7e8e3-0375-46bf-86e7-28c1514c7a61" />
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
unlimited-claude/
├── SIGN.txt                         # Signature: Mehrzad ArianMehr©
├── README.md                        # Full setup + feature docs
├── LICENSE                         # MIT License
├── start-windows.bat               # Windows one-click launcher (4-step)
├── start-mac.command               # macOS one-click launcher (4-step)
├── start-linux.sh                  # Linux one-click launcher (4-step)
│
└── app/                            # ── The Next.js project ──
    ├── package.json                # MIT, postinstall: prisma generate
    ├── bun.lock                    # Lockfile (reproducible installs)
    ├── .env                        # DATABASE_URL=file:./db/custom.db
    ├── .gitignore
    ├── next.config.ts              # transpilePackages: [@prisma/client, .prisma/client, sharp]
    ├── tsconfig.json
    ├── next-env.d.ts
    ├── tailwind.config.ts
    ├── postcss.config.mjs
    ├── components.json             # shadcn/ui config (New York style)
    ├── eslint.config.mjs
    ├── Caddyfile                   # Gateway config
    │
    ├── prisma/
    │   └── schema.prisma           # Profile, Chat, Message models
    │
    ├── public/
    │   ├── logo.svg                # App logo
    │   ├── robots.txt
    │   └── uploads/               # Generated/uploaded files (runtime)
    │
    ├── scripts/
    │   └── postbuild.mjs          # Cross-platform static-asset copy
    │
    └── src/
        ├── app/
        │   ├── page.tsx            # Single route — UC app shell + chat
        │   ├── layout.tsx          # Dark theme + puter.js + Toaster
        │   ├── globals.css         # Leonardo dark/light palette + glass + iridescent + motion
        │   └── api/
        │       ├── route.ts        # Health check
        │       ├── profile/
        │       │   └── route.ts    # GET/PATCH — user profile (name, avatar)
        │       ├── chats/
        │       │   ├── route.ts    # GET list / POST create
        │       │   └── [id]/
        │       │       ├── route.ts               # GET/PATCH/DELETE — one chat
        │       │       ├── messages/route.ts      # POST — send message + AI reply
        │       │       ├── export/route.ts        # GET — export chat as Markdown
        │       │       └── regenerate/route.ts    # POST — regenerate last AI reply
        │       ├── messages/
        │       │   └── [id]/route.ts              # PATCH — edit user message + resend
        │       ├── upload/
        │       │   └── route.ts    # POST — file upload (50MB, auto-compress >5MB)
        │       ├── skills/
        │       │   └── invoke/route.ts            # POST — /image /video skills
        │       └── download/
        │           └── zip/route.ts               # GET — download project zip
        │
        ├── components/
        │   ├── chat/
        │   │   ├── sidebar.tsx              # Right sidebar: brand, New chat, search, chat list, Puter login
        │   │   ├── chat-area.tsx            # Main chat: header, messages, empty state, scroll-to-bottom
        │   │   ├── chat-input.tsx           # Bottom composer: attach, model selector, autocomplete, send
        │   │   ├── message-bubble.tsx       # Message rendering: avatars, images, videos, copy, edit, regenerate
        │   │   ├── model-picker.tsx        # Big grouped model picker (empty state) — by company
        │   │   ├── help-popup.tsx          # First-load help popup (token-saving tips)
        │   │   ├── skills-panel.tsx        # ✨ Skills panel (toggle /image /video)
        │   │   ├── puter-account-card.tsx  # Puter login/account section (bottom of sidebar)
        │   │   └── markdown.tsx            # ReactMarkdown renderer with .uc-prose styling
        │   ├── puter-connect-prompt.tsx    # "Connect to AI" modal (when not signed into Puter)
        │   ├── theme-provider.tsx          # next-themes wrapper (dark/light)
        │   └── ui/                         # shadcn/ui primitives (40+ components)
        │       ├── button.tsx
        │       ├── input.tsx
        │       ├── textarea.tsx
        │       ├── dialog.tsx
        │       ├── sheet.tsx
        │       ├── dropdown-menu.tsx
        │       ├── alert-dialog.tsx
        │       ├── switch.tsx
        │       ├── badge.tsx
        │       ├── tooltip.tsx
        │       ├── scroll-area.tsx
        │       ├── ... (accordion, avatar, calendar, chart, checkbox, collapsible,
        │       │     command, context-menu, form, hover-card, label, menubar,
        │       │     navigation-menu, pagination, popover, progress, radio-group,
        │       │     select, separator, sidebar, skeleton, slider, sonner, table,
        │       │     tabs, toast, toaster, toggle, toggle-group)
        │
        ├── hooks/
        │   ├── use-puter-auth.ts   # Puter auth state tracker (polls window.puter)
        │   ├── use-mobile.ts        # Mobile detection (shadcn)
        │   └── use-toast.ts        # Toast hook (shadcn)
        │
        └── lib/
            ├── chat-store.ts       # Zustand store — chats, messages, profile, models, Puter AI
            ├── puter.ts           # Puter SDK types + getPuterReply() + listModels() + isPuterReady()
            ├── llm.ts             # z-ai SDK — getChatReply() (LLM + VLM vision) + generateChatTitle()
            ├── db.ts              # Prisma client singleton
            ├── chat-sections.ts   # Date-based chat grouping (Pinned/Today/Yesterday/...)
            ├── skills-registry.ts # 3 AI skills definitions (Nano Banana, Seedance, OpenAPI)
            ├── motion-presets.ts # Framer Motion spring presets (easeOutExpo, stagger, etc.)
            └── utils.ts          # cn() class merger (clsx + tailwind-merge)
```

## Notes

- Single local SQLite database (`db/custom.db`) stores all chats and messages.
- Image/video generation runs through the `z-ai` CLI (the SDK's image method hangs in the Next.js runtime, the CLI is reliable). Images take ~10–40s, videos longer (async + polling).
- Puter sign-in opens a popup to puter.com; your Puter username syncs to your local profile.

Enjoy! 🚀
