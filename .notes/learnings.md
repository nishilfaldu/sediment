# Learnings

Non-obvious traps and conventions **specific to this codebase**. Not a task log — use merged PRs for history (`gh pr list --state merged`). Not a style guide — match surrounding code for naming, file layout, and React patterns.

Add an entry only when something turned out meaningfully better than the naive approach and future agents would miss it by reading a single file.

---

## Agents

- Do the work yourself (edits, commands, config). Only escalate for product direction, credentials, or irreversible ops.
- `biome.json` is strict JSON — no `//` comments. A single comment breaks the whole config silently.

---

## IPC & types

Item / day / search CRUD is **not** on IPC — the renderer talks to Convex. `window.api` is OS-only (settings, clipboard suppress, export, toast, updater).

Cross-process contracts live in `src/shared/`:

- Domain types (`Item`, `ItemType`), IPC shapes (`Api`), pure logic (`detectContent`, link presentation, share formatters)
- Preload typed as `Api` — no `unknown` casts in renderer hooks

Enum unions: `as const` arrays in `@shared/types`, union derived with `(typeof ARR)[number]`.

---

## Database (Convex)

- Source of truth is `convex/schema.ts`: `authTables`, `items`, `dayDigests`, `downloadSignups`. No local SQLite / Drizzle.
- Day boards are derived from each item's `dayId` (ISO local date string). There is no `days` table; empty today is client-side until the first item. Sidebar counts come from `dayDigests`.
- Item types in the DB are only `text` and `link`. URL host tags (YouTube, X, etc.) live in `src/shared/link-presentation.ts` and are derived at display time — not stored on the row.
- Search uses Convex `searchIndex` on `items.searchText` (`convex/search.ts`), not SQLite FTS. Keep `searchText` in sync when creating/updating items.
- UI `createdAt` is Convex `_creationTime`. Auth every public function that touches user data.
- Packaged builds bake `VITE_CONVEX_URL` from `.env.production` (prod). Dev keeps `.env.local`. After backend changes that should ship, run `bunx convex deploy` — release tags alone do not push Convex.

---

## Electron

- Dev script unsets `ELECTRON_RUN_AS_NODE` (`"dev": "ELECTRON_RUN_AS_NODE= electron-vite dev"`). Cursor/VS Code terminals set it; without unsetting, no window opens.
- Main process must output ESM (`format: 'es'`). Electron 36+ doesn't intercept CJS `require('electron')`.
- Remove CSP `<meta>` tags from `index.html` — they break Vite HMR in dev. Security boundary is context isolation + preload.
- macOS releases must be ad-hoc signed (`identity: '-'`) when no Apple Developer cert — `identity: null` skips signing and Apple Silicon reports the app as "damaged". Ad-hoc is not notarization; users still need `xattr -cr`, right-click → Open, or System Settings → Open Anyway. Seamless installs need `APPLE_ID` + `CSC_LINK` secrets in GitHub for Developer ID sign + notarize (`electron-builder.notarized.yml`).
- Dock / Applications icon comes from `build/icon.icns` (electron-builder `buildResources`). Tray uses `resources/trayTemplate.png` (16px) + `resources/trayTemplate-32.png` (@2x) as a macOS template image. Never leave the Electron default atom in `build/icon.*`.
- In-app updates (no Apple notarization required): releases must publish **dmg + zip** (`electron-builder.yml`). Do **not** add a root `zip:` key — electron-builder 26 rejects it; use shared `artifactName`. The packaged app checks GitHub `releases/latest`, downloads the arch zip, replaces the running `.app` with `ditto`, and relaunches. Browser DMGs still get Gatekeeper quarantine; in-app zip swaps usually do not. Electron-builder often leaves the GitHub Release as a **draft** — publish it (`gh release edit vX.Y.Z --draft=false --latest`) or `/releases/latest` and the download gate stay on the previous version.
- OTP verify form: never put a hidden `name="email"` input next to the code field — browsers autofill the address into the Code box. Pass email via FormData in the submit handler; keep the code input controlled and empty on step change.
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

Packaged app paths: `dist/mac-arm64/Sediment.app` (Apple Silicon) or
`dist/mac/Sediment.app` (Intel). Launch either with `--remote-debugging-port=9222`.

Packaged app userData is `~/Library/Application Support/Sediment/` (productName),
dev uses `.../sediment/` (package name) — separate local settings JSON; items themselves live in Convex.
