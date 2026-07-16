# Sediment

[![Electron](https://img.shields.io/badge/Electron-39-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-local--first-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

> A home for everything you want to keep. Copy a link from anywhere and it lands
> on today's board. Jot a note when you need one. One day, one page. Things just
> pile up, like sediment.

## Why I built this

I get inspired by something almost every single day — a thread on Twitter, a post
on Instagram or LinkedIn, a line in an article I am reading on the web. Every one
of those platforms has its own save button, but that is exactly the problem: my
inspiration ends up scattered across five different apps, each one a silo I rarely
open again. None of those saved folders are *mine*. By the time I want any of it
back, it is gone in practice — buried somewhere I will never think to look.

So I wanted one place. Not a folder tree to maintain, not tags to invent, not a
decision to make every time. Just one workspace per day. Whatever catches my eye
goes there, and it piles up. Maybe I look back at a day, maybe I never do. The
point is that capturing it costs nothing, and nothing leaves my machine.

The real payoff is later. When I am chasing an idea and that nagging feeling hits —
*I came across something about this once* — I do not want to dig through five apps.
I press `Cmd+K`, search across everything I have ever saved, and there it is. That
ability to walk back to my own inspiration, in one place, was the actual reason I
built this.

Each day is its own board. Copy a link and it settles onto today. That is the
whole idea, and the name comes from it: layers of small things accumulating quietly
over time.

## What it does

| | |
|---|---|
| **One board per day** | The app opens to today. Past days are there when you want them, out of the way when you do not. |
| **Automatic link capture** | Copy a URL anywhere — Sediment watches the clipboard and saves it to today's Links tab. An undo toast appears if you change your mind. |
| **Links and Notes tabs** | Copied URLs live under Links. Plain-text thoughts live under Notes, separate from link artifacts. |
| **URL presentation** | Known hosts (YouTube, X, etc.) get specimen tags on the card — derived from the URL at display time, not stored as separate types. |
| **Rich previews** | Links and posts get titles, descriptions, and thumbnails pulled from their page metadata. |
| **Grid layout** | Links appear in a responsive card grid. Notes stack in a single column. |
| **Full-text search** | Search across everything you have ever saved, powered by SQLite FTS (`Cmd+K`). |
| **Local-first** | Everything is stored on your device in SQLite. Nothing is uploaded anywhere. |

### What gets recognized

| Stored as | Specimen tags (from URL) |
|---|---|
| `link` | **Video:** YouTube, Vimeo, TikTok, Twitch, Dailymotion, Rumble, Kick, Facebook Watch · **Social:** X, Instagram, Bluesky, Threads, Reddit, LinkedIn, Pinterest, Tumblr, Telegram, Discord, Mastodon, Lemmy, Patreon, Snapchat · **Dev & reading:** GitHub, GitLab, Hacker News, Stack Overflow, DEV, Notion, Figma, npm, PyPI, Substack, Medium, Spotify, SoundCloud, arXiv, Wikipedia, Bandcamp, Product Hunt, itch.io · short links (`youtu.be`, `t.co`, `redd.it`, etc.) · anything else shows as **link** |
| `text` | Notes you add on the Notes tab |

Clipboard capture handles URLs only. Notes are added with the **Add note** button.

## How it works

Sediment is a macOS desktop app built on Electron, split across two JavaScript
worlds that talk through a single typed bridge.

- **Main process** (Node.js) owns the OS layer: the SQLite database, clipboard
  watching, and fetching page metadata for links.
- **Renderer process** (React) is all UI. It has no direct Node access; it talks
  to the main process only through a typed `window.api` exposed by the preload
  bridge.

When you copy a URL, the main process detects it, writes a row to SQLite, and
notifies the renderer. The Links tab updates and an undo toast appears. For links
it then fetches Open Graph metadata in the background and fills in the preview.

```
Renderer (React)        Preload               Main (Node.js)
window.api.items   →    ipcRenderer.invoke →  ipcMain.handle → SQLite
  .getByDay(dayId)  ←   Promise resolves   ←  returns rows

clipboard copy     →    (poll)             →  detect URL → save → push event
```

## Tech stack

| Layer | Choice |
|---|---|
| Desktop shell | Electron 39 via electron-vite |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Database | SQLite (`better-sqlite3`), main process only |
| ORM | Drizzle ORM + drizzle-kit |
| State | TanStack Query (server state) + Zustand (UI state) |
| Board layout | Responsive grid (links) + single-column notes |
| Page metadata | cheerio |
| Lint + format | Biome |
| Package manager | Bun |

## Download

**Page: [nishilfaldu.site/projects/sediment](https://nishilfaldu.site/projects/sediment)**

Or grab the latest `.dmg` from [Releases](https://github.com/nishilfaldu/sediment/releases/latest)
(Apple Silicon and Intel DMGs). If Gatekeeper blocks the first launch, run:

```bash
curl -fsSL https://raw.githubusercontent.com/nishilfaldu/sediment/master/scripts/macos-install.sh | bash
```

Or use **System Settings → Privacy & Security → Open Anyway**, or right-click
**Sediment.app → Open** (don't double-click the first time).

## Running it locally

Requires [Bun](https://bun.sh/) and macOS.

```bash
bun install
bun dev          # Electron + renderer with hot reload
```

Other useful scripts:

```bash
bun run check              # Biome lint + format
bun run typecheck          # tsc across main + renderer
bun run build:mac          # package a macOS build locally
```

Releases are automated: bump `version` in `package.json`, commit, then
`git tag vX.Y.Z && git push origin vX.Y.Z` to trigger the GitHub Action.

## Status

An ongoing personal project. The core loop — clipboard link capture, Links/Notes
tabs, auto-detect, rich previews, per-day history, and full-text search — works
today. I keep adding to it as I find new things I want to throw onto a page and
forget about until I need them.

Built with [Claude Code](https://claude.com/claude-code). Released under the
[MIT License](LICENSE).
