# Phase 1 — DB Schema, Migrations, IPC Skeleton

**Status:** 🔲 Next

## Goal
Get data flowing end-to-end: DB initialises on startup, a basic IPC call from the renderer returns real data from SQLite.

## Tasks
- [ ] Write Drizzle schema in `src/main/db/schema.ts` (items + days tables)
- [ ] Run `bunx drizzle-kit generate` to produce migration SQL
- [ ] Write `src/main/db/index.ts` — open DB at `userData/sediment.db`, enable WAL mode, run migrations on startup
- [ ] Register all `ipcMain.handle` channels in `src/main/ipc/` (items, days, search stubs)
- [ ] Wire IPC registration into `src/main/index.ts`
- [ ] Confirm one round-trip (`items:getByDay`) works in DevTools
