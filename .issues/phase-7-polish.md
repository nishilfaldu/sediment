# Phase 7 — Polish

**Status:** ✅ Done

## Tasks
- [x] Window size/position persistence across restarts — `src/main/services/window-state.ts`, dependency-free JSON in userData (no `electron-store`); validates the saved position still lands on a connected display
- [x] macOS tray icon — `src/main/services/tray.ts`; left-click toggles the window, context menu Open/Quit; template image adapts to light/dark menu bar
- [x] Export day as Markdown file — `src/main/ipc/export.ts` (save dialog + writes `.md`), "Export" action in the bottom bar
- [x] `electron-builder` DMG for distribution — already configured in `electron-builder.yml` (mac target + dmg artifact); `bun run build:mac` produces it (running a signed/notarized build is an environment step, not code)
- [x] App icon — `build/icon.{icns,ico,png}` + `resources/icon.png` present and referenced via `buildResources`; tray reuses `resources/icon.png`
