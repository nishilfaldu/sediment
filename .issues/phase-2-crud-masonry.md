# Phase 2 — Core CRUD + Masonry Grid UI

**Status:** 🔲 Pending

## Goal
A usable daily board: add text items, see them in a masonry grid, delete them, navigate between days via the sidebar.

## Tasks
- [ ] All `items:*` and `days:*` IPC handlers fully implemented
- [ ] `MasonryGrid` component (CSS columns)
- [ ] `TextCard` — inline editable
- [ ] `CardWrapper` — shared chrome: drag handle, delete button
- [ ] `DayBoard` wired to `useItems` hook + TanStack Query
- [ ] `Sidebar` + `CalendarNav` wired to `useDays`
- [ ] Drag-to-reorder cards with `@dnd-kit/sortable`
- [ ] `EmptyState` for days with no content
