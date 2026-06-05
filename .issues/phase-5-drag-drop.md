# Phase 5 — Drag & Drop Files

**Status:** ✅ Done

## Goal
Drag image files or URLs from any app onto the board and have them saved as items.

## Tasks
- [x] `useBoardDrop` hook wired into `DayBoard` — owns all drop handlers + drag state
- [x] Handle `dataTransfer.files` — images → `FileReader` base64 → `items:create` (cascaded so multi-file drops don't stack)
- [x] Handle `dataTransfer.getData('text/uri-list')` — URLs dragged from browser → `detectUrl`; non-URL text → plain text item
- [x] Visual drop target feedback — inset sky ring on the scroll viewport while dragging over the board (depth-counted to avoid child-element flicker)
