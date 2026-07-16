# Sediment — Technical Documentation for AI Agents

⚠️ **IMPORTANT FOR AI AGENTS:** This file (`AGENTS.md`) and `CLAUDE.md` are clones — keep them in sync on substantial changes. Skip minor UI/copy edits.

**Native SDK skills** live in `.agents/skills/`, `.cursor/skills/`, and `.claude/skills/` (`native-sdk`, `core`, `ts-core`, `native-ui`, `automation`, `zig`). Before changing the app, load the relevant skill (`native skills get ts-core`, `native skills get native-ui`, etc.).

---

## What is Sediment?

A personal content collection desktop app for macOS. Throughout the day you encounter things worth saving — a tweet, an article, a quote, a YouTube video. Instead of bookmarking to a forgotten folder, Sediment gives you **one canvas per day** where everything lands together. Copy a link → it is saved. Add a note when you need one.

---

## Tech stack (Native SDK)

| Layer | Choice |
|---|---|
| Toolkit | [Native SDK](https://native-sdk.dev/) via `@native-sdk/cli` |
| Logic | TypeScript app-core (`src/core.ts` + modules), compiled to native (no JS in the binary) |
| UI | Native markup (`src/app.native`) |
| Manifest | `app.zon` |
| Persistence | `Cmd.readFile` / `Cmd.writeFile` under `~/Library/Application Support/Sediment/` |
| Capture | Clipboard polling via `Sub.timer` + `Cmd.clipboardRead` |
| Previews | `Cmd.fetch` + best-effort OG/meta parse in `src/og.ts` |

There is **no Electron, React, SQLite, or Node runtime** in the shipped binary. Master (`master` branch) still has the previous Electron implementation for behavioral reference — use `git show master:<path>` when porting behavior.

---

## Architecture

```
src/core.ts     Model, Msg, update, subscriptions, binding helpers
src/app.native  Entire UI (field-guide shell: board left, history right)
src/theme.zig   Sediment paper/ink/moss DesignTokens + Archivo/Plex/Besley ids
src/wire.zig    App-owned TsUiApp wiring — tokens, fonts, thumb image register
assets/fonts/   Bundled field-guide TTFs (staged into `.native/gen/fonts/`)
src/store.ts    Encode/decode durable item store
src/detect.ts   URL detection
src/tags.ts     Link specimen tags from hostname
src/og.ts       Open Graph / title extraction from HTML bytes
src/bytes.ts    Byte helpers (concat, decimal, search)
build.zig       Ejected graph: stages wire+theme into `.native/gen/`, transpiles core
app.zon         Identity, window, permissions (clipboard, network)
```

Loop: events → messages → `update` → model → markup bindings. Effects are `Cmd` data; recurring clipboard polls are `Sub` data.

**Theming:** Stock TS apps only get `app.zon` `theme` / `theme_accent`. Sediment needs the full field-guide palette + faces, so `build.zig` stages `src/wire.zig` (not the SDK’s `ts_core_main`) with static `tokens` from `src/theme.zig` and embeds `assets/fonts/` (Archivo, IBM Plex Mono, Besley). OG thumbnails register via a wrapped `update_fx` (`fx.registerImageBytes`) and render as rectangular `<avatar radius="sm">` covers. Do not add `src/main.zig` alongside `src/core.ts`.

---

## Development commands

```bash
native check          # subset-check core + validate markup + app.zon
native dev --core     # logic loop under node (JSON-line messages)
native dev            # real window, markup hot reload
native build          # ReleaseFast binary → zig-out/bin/
native test           # app tests
bun scripts/roundtrip.mts   # store encode/decode + OG parse checks
native skills list    # agent skill catalog from the CLI
```

Requires Node.js 22.15+ (transpiler at build time) and Zig 0.16 (CLI downloads if needed).

---

## Website & distribution

- Marketing site: `website/` → https://getsediment.vercel.app
- Packaging: `native package` (see Native SDK Packaging docs)

---

## History

- Electron era: `master` branch / merged PRs
- Native SDK rewrite: this branch (`native-sdk`)
