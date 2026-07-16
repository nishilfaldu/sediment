# Sediment

A local-first macOS app for everything you want to keep. Copy a link from
anywhere and it lands on today's board. Jot a note when you need one. One day,
one page — layers of small things accumulating quietly over time.

Built with the [Native SDK](https://native-sdk.dev/): TypeScript logic and
declarative markup compile to a native binary (no Electron, no WebView, no JS
runtime in the shipped app).

## Features

| | |
|---|---|
| **One board per day** | Opens to today. Past days stay in a sidebar. |
| **Automatic link capture** | Copy a URL anywhere — Sediment saves it to today's Links tab, with Undo. |
| **Links and Notes** | URLs under Links; plain-text thoughts under Notes. |
| **Specimen tags** | Known hosts (YouTube, X, GitHub, …) get a tag derived from the URL. |
| **Rich previews** | Best-effort Open Graph title/description/image via `Cmd.fetch`. |
| **Search** | Search across everything you've saved. |
| **Local-first** | Store lives under `~/Library/Application Support/Sediment/`. |

## Develop

```sh
npm install -g @native-sdk/cli   # once
native check                     # subset-check + markup + app.zon
native dev                       # window + markup hot reload
native dev --core                # logic-only loop under node
native build                     # ReleaseFast → zig-out/bin/sediment
```

Requires Node.js 22.15+ (build-time transpiler only) and Zig 0.16 (the CLI can
download it).

| File | Role |
|---|---|
| `src/core.ts` | Model, Msg, update |
| `src/app.native` | UI |
| `app.zon` | Identity, window, permissions |

Agent skills for this toolkit are **not** vendored in-tree. When working on
this Native port, pull what you need with `native skills get …` (see `AGENTS.md`).

## Website

Marketing site in `website/` → [getsediment.vercel.app](https://getsediment.vercel.app).

## License

MIT — see [LICENSE](LICENSE).
