# Phase 2 — Core CRUD + Masonry Grid UI

**Status:** Superseded — the app uses a freeform canvas with absolute positioning and custom pointer drag instead of a masonry grid.

## Goal (original)
A usable daily board: add text items, see them in a masonry grid, delete them, navigate between days via the sidebar.

## What shipped instead
- Freeform `DayBoard` canvas with drag-to-position items
- `TextBlock` for inline-editable text items
- `HistoryPanel` for day navigation
- Custom pointer drag (`useCanvasDrag`) instead of `@dnd-kit`

## Remaining from original plan
- [ ] `days.note` UI (schema column exists, unused)
