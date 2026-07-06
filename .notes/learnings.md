# Learnings

Non-obvious traps and conventions **specific to this codebase**. Not a task log — use merged PRs for history (`gh pr list --state merged`). Not a style guide — match surrounding code for naming, file layout, and React patterns.

Add an entry only when something turned out meaningfully better than the naive approach and future agents would miss it by reading a single file.

---

## Agents

- Do the work yourself (edits, commands, config). Only escalate for product direction, credentials, or irreversible ops.
- `biome.json` is strict JSON — no `//` comments. A single comment breaks the whole config silently.

---

## IPC & types

The renderer cannot import `src/main/db/schema.ts` (transitive `better-sqlite3`). Cross-process contracts live in `src/shared/`:

- Domain types (`Item`, `ItemType`), IPC shapes (`Api`, `CreateItemPayload`), pure logic (`detectContent`)
- Preload typed as `Api` — no `unknown` casts in renderer hooks

Main derives DB input types from Drizzle (`Omit<NewItem, …>`). Shared types mirror the row shape for IPC.

Enum unions: `as const` arrays in `@shared/types`, union derived with `(typeof ARR)[number]`.

---

## Database

- Derive `Item` / `NewItem` from `typeof items.$inferSelect` / `$inferInsert` in `schema.ts` — don't hand-write row interfaces on the main side.
- Drizzle can't express FTS5 `MATCH`. Export `getSqlite()` alongside `getDb()`; use raw SQL only for FTS.
- Migrations: custom runner in `src/main/db/index.ts` runs all `*.sql` files (hand-written FTS5 + drizzle-kit output). `drizzle-kit migrate` alone won't apply FTS SQL.

---

## Electron

- Dev script unsets `ELECTRON_RUN_AS_NODE` (`"dev": "ELECTRON_RUN_AS_NODE= electron-vite dev"`). Cursor/VS Code terminals set it; without unsetting, no window opens.
- Main process must output ESM (`format: 'es'`). Electron 36+ doesn't intercept CJS `require('electron')`.
- Remove CSP `<meta>` tags from `index.html` — they break Vite HMR in dev. Security boundary is context isolation + preload.
- `better-sqlite3` is compiled against Electron's V8 — pin versions together; `postinstall` runs `electron-rebuild`.
- After scaffolding, grep for unused template deps and remove them.

---

## Testing the packaged app (no accessibility permissions needed)

Launch with a CDP port and drive it over WebSocket — real input events and
pixel-accurate renderer screenshots, without stealing window focus or needing
macOS assistive access:

```bash
open dist/mac-arm64/Sediment.app --args --remote-debugging-port=9222
```

Then hit `http://127.0.0.1:9222/json` for the page target and use
`Input.dispatchKeyEvent` (⌘K = modifiers: 4), `Input.insertText`,
`Runtime.evaluate` for clicks, and `Page.captureScreenshot`. Bun's built-in
WebSocket does this in a ~60-line script — no puppeteer needed. Gotchas:
top-level `const` in `Runtime.evaluate` persists across calls (wrap in IIFE);
clipboard capture is exercised end-to-end with `pbcopy` while the app runs.

Packaged app userData is `~/Library/Application Support/Sediment/` (productName),
dev uses `.../sediment/` (package name) — separate databases.
