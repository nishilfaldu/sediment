# Phase 6 — Full-Text Search

**Status:** ✅ Done

## Goal
`Cmd+K` opens a search modal that finds items across all days instantly.

## Tasks
- [x] FTS5 virtual table + INSERT/UPDATE/DELETE triggers — already shipped as `0001_fts.sql` (not 0002; FTS landed in the earlier migration)
- [x] `search:query` IPC handler — FTS5 `MATCH` query with input sanitised into quoted prefix tokens (`"rea"*`) so punctuation/empty input can't throw; returns results with `dayId`
- [x] `SearchModal` component — opens on `Cmd+K`/`Ctrl+K`, closes on `Escape` or backdrop click, arrow-key + Enter navigation, debounced query
- [x] Results grouped by day, each result clickable; navigates to that day via `goToItem` and the target `CanvasItem` scrolls into view + flashes a ring
