# Sediment — Technical Documentation for AI Agents

⚠️ **IMPORTANT FOR AI AGENTS:** This file (`CLAUDE.md`) and `AGENTS.md` are clones — keep them in sync on substantial changes (architecture, data flow, IPC patterns, new major features). Skip minor UI/copy edits. When one is updated, mirror immediately.

**Code conventions, patterns, and agent behaviour rules** are in [`.notes/learnings.md`](.notes/learnings.md) — read it before writing code. Add a new entry any time something turns out meaningfully better than the naive approach.

---

## What is Sediment?

A personal content collection desktop app for macOS. Throughout the day you encounter things worth saving — a tweet, an article, a quote, a YouTube video, an image. Instead of bookmarking to a forgotten folder, Sediment gives you **one canvas per day** where everything lands together. Copy anything → `Cmd+Shift+S` → it's saved.

---

## User Experience Philosophy

- **Zero friction capture:** hotkey saves from anywhere, no app switching
- **One day, one canvas:** opens to today; past days accessible but out of the way
- **Auto-everything:** type detected, previews fetched, layout arranged automatically
- **Local-first:** nothing leaves the device

---

## Tech Stack

| Layer | Choice |
|---|---|
| Desktop shell | Electron 39 via electron-vite |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`, no config file) |
| Database | SQLite via `better-sqlite3` (main process only) |
| ORM | Drizzle ORM + drizzle-kit |
| Renderer state | TanStack Query v5 (server state) + Zustand v5 (UI state) |
| Drag-reorder | @dnd-kit/sortable |
| OG metadata | cheerio (main process only) |
| Lint + format | Biome (replaces ESLint + Prettier) |
| Package manager | Bun |

---

## Architecture

Two separate JS environments — understanding the boundary is critical.

### Main Process (`src/main/`)
Node.js. Owns the OS layer: SQLite, filesystem (`userData/images/`), global shortcuts, clipboard, OG fetching, all `ipcMain.handle` registrations. Think of it as the backend.

### Renderer Process (`src/renderer/`)
Chromium + React. All UI. No direct Node.js access — talks to main exclusively through the preload bridge.

### Preload (`src/preload/`)
Exposes a typed `window.api` object via `contextBridge`. The **only** channel between renderer and main. Shape declared in `src/preload/index.d.ts`.

```
Renderer (React)        Preload               Main (Node.js)
window.api.items   →    ipcRenderer.invoke →  ipcMain.handle → DB query
  .getByDay(dayId)  ←   Promise resolves   ←  returns rows
```

IPC is request/response (`invoke`/`handle`). Events pushed main→renderer (e.g. clipboard hotkey) use `webContents.send` / `ipcRenderer.on`.

---

## Development Commands

```bash
bun dev                    # Electron + renderer with HMR
bun run check              # Biome lint + format (run before committing)
bun run typecheck          # tsc across main + renderer
bunx drizzle-kit generate  # generate SQL migrations after schema changes
```

---

## Issues & Implementation Roadmap

See [`.issues/`](.issues/) for per-phase task files.
