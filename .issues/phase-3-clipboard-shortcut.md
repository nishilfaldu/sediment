# Phase 3 — Clipboard Global Shortcut

**Status:** 🔲 Pending

## Goal
Copy anything on macOS, press `Cmd+Shift+S`, and it lands on today's board instantly.

## Tasks
- [ ] `src/main/services/clipboard.ts` — read text and image from Electron clipboard
- [ ] `src/main/services/contentDetector.ts` — classify incoming string (text / link / video / social / image)
- [ ] `src/main/services/globalShortcut.ts` — register `CommandOrControl+Shift+S`, send `shortcut:triggered` event to renderer, call `mainWindow.show()`
- [ ] `useClipboardHotkey` hook in renderer — subscribe to event, call `items:create` mutation
- [ ] Toast notification confirming save
