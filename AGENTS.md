# Sediment — Technical Documentation for AI Agents

⚠️ **IMPORTANT FOR AI AGENTS:** This file (`AGENTS.md`) is the single source of truth for project guidance. `CLAUDE.md` only points here — do not mirror content into it.

**Project-specific traps** (not history, not style) are in [`.notes/learnings.md`](.notes/learnings.md) — skim before touching IPC, DB, or Electron.

---

## What is Sediment?

A personal content collection desktop app for macOS. Throughout the day you encounter things worth saving — a tweet, an article, a quote, a YouTube video, an image. Instead of bookmarking to a forgotten folder, Sediment gives you **one board per day** (Links + Notes tabs) where everything lands together. Copy a URL → clipboard watcher saves it to today; optional Settings hotkey brings the window forward.

---

## User Experience Philosophy

- **Zero friction capture:** clipboard URL watch (plus optional global hotkey to show the app)
- **One day, one board:** opens to today; past days accessible but out of the way
- **Auto-everything:** type detected, previews fetched, layout arranged automatically
- **Cloud-synced:** data lives in Convex so the same account works across devices (web later)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Desktop shell | Electron 39 via electron-vite |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`, no config file) |
| Backend / DB | Convex (cloud) + Convex Auth (Resend email OTP) |
| Renderer data | Convex React hooks (`useQuery` / `useMutation`) + Zustand v5 (UI state) |
| Board layout | Responsive link grid + single-column notes (Links / Notes tabs) |
| OG metadata | Convex Node action (`convex/og.ts`) via cheerio |
| Lint + format | Biome (replaces ESLint + Prettier) |
| Package manager | Bun |

---

## Architecture

Three JS environments plus Convex and a shared contract layer.

### Shared (`src/shared/`)
Pure TypeScript modules imported by main, preload, and renderer: IPC types (`Api`), domain types (`Item`, `ItemType`), URL detection, labels, and share formatters.

### Convex (`convex/`)
Source of truth for items and auth. Renderer talks to Convex directly. Day boards are derived from each item's `dayId` string (no separate days table). Schema includes `authTables` plus `items`.

### Main Process (`src/main/`)
Node.js OS layer only: clipboard watching, global hotkey, capture toast window, export save-dialog / clipboard write / `shell.openExternal`, local settings JSON. Does **not** own item CRUD anymore.

### Renderer Process (`src/renderer/`)
React UI + Convex client (`ConvexAuthProvider`). Sign-in gate, then the day board. Clipboard capture: main detects URL → `clipboard:candidate` → renderer creates via Convex.

### Preload (`src/preload/`)
Exposes typed `window.api` for OS concerns (settings, clipboard suppress, export helpers, toast). Not used for item/day CRUD.

```
Renderer (React)  →  Convex queries/mutations  →  cloud DB
Main (clipboard)  →  clipboard:candidate event  →  Renderer creates item
```

---

## Development Commands

```bash
bunx convex dev            # link project, codegen, push functions (first-time setup)
bunx @convex-dev/auth      # JWT keys + SITE_URL for Convex Auth
bunx convex env set AUTH_RESEND_KEY <key>   # Resend API key for email OTP
bun run dev:convex         # watch Convex
bun dev                    # Electron + renderer with HMR
bun run dev:all            # convex dev --start electron-vite
bun run check              # Biome lint + format (run before committing)
bun run typecheck          # tsc across main + renderer
```

Requires `VITE_CONVEX_URL` in `.env.local` (written by `convex dev`) for local development, and `AUTH_RESEND_KEY` on the Convex deployment.

**Dev vs prod:** `.env.local` → personal **dev** deployment. `.env.production` (committed) → **prod** (`bright-lark-824`) and is what `electron-vite build` / GitHub releases bake in. Push backend with `bunx convex deploy` (never during casual coding). Marketing-site download gate must POST to the **prod** `.convex.site` URL (`https://bright-lark-824.convex.site/download`), not the dev firefly deployment.

---

## Website & distribution

- **Public page / download:** [nishilfaldu.site/projects/sediment](https://nishilfaldu.site/projects/sediment)
  (portfolio site). Email gate posts to Convex `POST /download`, which returns the latest
  Mac DMGs from GitHub `releases/latest` — no hardcoded version on the site.
- **Releases:** pushing a `v*` tag triggers `.github/workflows/release.yml` on `macos-latest`.
  With GitHub secrets `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`,
  `CSC_LINK`, and `CSC_KEY_PASSWORD` set, builds are Developer ID signed and notarized
  (opens normally). Without those secrets, ad-hoc signing is used and users must bypass
  Gatekeeper once (`scripts/macos-install.sh` or System Settings → Open Anyway).
  Ships **dmg** (site download) + **zip** (in-app updater) for arm64 and x64. Cut a release:
  bump `version` in `package.json`, commit, `git tag vX.Y.Z && git push origin vX.Y.Z`.
  Packaged apps check GitHub Releases and can replace themselves via Settings → Install.
---

## History & planning

- **What was done:** merged PRs on GitHub (`gh pr list --state merged`). PR bodies are the changelog — no local task files.
- **Future work / bugs:** GitHub Issues, only when something needs tracking outside a PR.

---

## Cursor Cloud specific instructions

Sediment is a single Electron desktop app (main + preload + renderer) backed by Convex. Standard commands live in the **Development Commands** section above and in `package.json` scripts. Run `bunx convex dev` (or ensure `.env.local` has `VITE_CONVEX_URL`) before `bun dev`.

Non-obvious caveats for running/testing here (headless Linux, not macOS):

- **Running the app:** launch `bun dev` inside a long-lived tmux session (it stays running with HMR). A virtual X display is already available at `DISPLAY=:1`; the app renders there. If no display exists, wrap with `xvfb-run -a`.
- **Sandbox:** Electron's setuid sandbox fails in this container. Export `ELECTRON_DISABLE_SANDBOX=1` in the shell before `bun dev`, otherwise the window never opens.
- **Benign startup noise:** `Failed to connect to the bus` (dbus) and `Exiting GPU process ... errors during initialization` are expected in headless mode and do NOT indicate failure — the window still renders.
- **Auth:** first launch shows email OTP sign-in (Convex Auth + Resend). Enter email → code → signed in.
- **Testing link capture:** the main process polls the clipboard for `http(s)` URLs and the renderer saves them to today's Links tab via Convex. To exercise it end-to-end (while signed in), set the clipboard (`printf 'https://example.com' | DISPLAY=:1 xclip -selection clipboard`). A toast with **Undo** should appear; the link card lands on the Links grid. OG metadata fetches in a Convex action (needs internet; failures are swallowed and the item still saves).
- **Lint:** `bun run check` rewrites/formats files in place; use `bun run lint` for a read-only check. There are 2 pre-existing lint warnings (exhaustive-deps) unrelated to setup.
- **Database:** Convex cloud deployment (see dashboard). Item `createdAt` in the UI is Convex `_creationTime`.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
