# Sediment — Technical Documentation for AI Agents

⚠️ **IMPORTANT FOR AI AGENTS:** This file (`CLAUDE.md`) and `AGENTS.md` are clones — keep them in sync on substantial changes (architecture, data flow, IPC patterns, new major features). Skip minor UI/copy edits. When one is updated, mirror immediately.

**Project-specific traps** (not history, not style) are in [`.notes/learnings.md`](.notes/learnings.md) — skim before touching IPC, DB, or Electron.

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
| Canvas layout | Freeform absolute positioning with custom pointer drag |
| OG metadata | cheerio (main process only) |
| Lint + format | Biome (replaces ESLint + Prettier) |
| Package manager | Bun |

---

## Architecture

Three JS environments plus a shared contract layer — understanding the boundaries is critical.

### Shared (`src/shared/`)
Pure TypeScript modules imported by main, preload, and renderer: IPC types (`Api`, `CreateItemPayload`), domain types (`Item`, `ItemType`), URL detection (`detectContent`), and labels. Keeps the IPC contract typed without the renderer importing main-process modules.

### Main Process (`src/main/`)
Node.js. Owns the OS layer: SQLite, filesystem (`userData/images/`), global shortcuts, clipboard, OG fetching, all `ipcMain.handle` registrations. Think of it as the backend.

### Renderer Process (`src/renderer/`)
Chromium + React. All UI. No direct Node.js access — talks to main exclusively through the preload bridge.

### Preload (`src/preload/`)
Exposes a typed `window.api` object via `contextBridge`. The **only** channel between renderer and main. Shape typed via `@shared/ipc`.

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

## History & planning

- **What was done:** merged PRs on GitHub (`gh pr list --state merged`). PR bodies are the changelog — no local task files.
- **Future work / bugs:** GitHub Issues, only when something needs tracking outside a PR.

---

## Cursor Cloud specific instructions

Sediment is a single Electron desktop app (main + preload + renderer). Standard commands live in the **Development Commands** section above and in `package.json` scripts. The dependency-refresh step (`bun install`, which runs the `postinstall` native rebuild of `better-sqlite3` against Electron's ABI) is handled by the startup update script — you do not need to run it manually.

Non-obvious caveats for running/testing here (headless Linux, not macOS):

- **Running the app:** launch `bun dev` inside a long-lived tmux session (it stays running with HMR). A virtual X display is already available at `DISPLAY=:1`; the app renders there. If no display exists, wrap with `xvfb-run -a`.
- **Sandbox:** Electron's setuid sandbox fails in this container. Export `ELECTRON_DISABLE_SANDBOX=1` in the shell before `bun dev`, otherwise the window never opens.
- **Benign startup noise:** `Failed to connect to the bus` (dbus) and `Exiting GPU process ... errors during initialization` are expected in headless mode and do NOT indicate failure — the window still renders and SQLite migrations still run (look for `[db] migration applied: ...` in the logs).
- **Testing the core capture flow:** capture is driven by the global shortcut `Cmd/Ctrl+Shift+S`, which reads the OS clipboard. To exercise it end-to-end, set the clipboard first (`printf 'https://example.com' | DISPLAY=:1 xclip -selection clipboard`), then inject the shortcut / press it via the desktop. A card appears on the canvas and the status bar increments. Link/video/social items also fire an outbound OG-metadata fetch (needs internet; failures are swallowed and the item still saves).
- **Lint:** `bun run check` rewrites/formats files in place; use `bun run lint` for a read-only check. There are 2 pre-existing lint warnings (exhaustive-deps) unrelated to setup.
- **Database:** SQLite lives under Electron's `userData` dir (`sediment.db`, WAL). Migrations in `src/main/db/migrations/*.sql` run automatically on startup; no external DB server.
