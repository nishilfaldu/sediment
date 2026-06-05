import { join } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { app } from 'electron'
import * as schema from './schema'

// Lazily initialised — call initDb() once in app.whenReady()
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null
let _sqlite: Database.Database | null = null

export function initDb(): void {
  const dbPath = join(app.getPath('userData'), 'sediment.db')
  const sqlite = new Database(dbPath)

  // WAL mode gives better read concurrency and is safe for single-process use
  sqlite.pragma('journal_mode = WAL')
  // Enforce foreign key constraints (SQLite disables them by default)
  sqlite.pragma('foreign_keys = ON')

  _sqlite = sqlite
  _db = drizzle(sqlite, { schema })

  runMigrations(sqlite)
}

// Returns the Drizzle ORM instance. Throws if initDb() hasn't been called.
export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!_db) throw new Error('DB not initialised — call initDb() first')
  return _db
}

// Returns the raw better-sqlite3 instance for queries Drizzle can't express
// (e.g. FTS5 MATCH). Throws if initDb() hasn't been called.
export function getSqlite(): Database.Database {
  if (!_sqlite) throw new Error('DB not initialised — call initDb() first')
  return _sqlite
}

// Runs all *.sql files in the migrations folder in lexicographic order.
// Drizzle's migrator doesn't support hand-written FTS5 SQL natively,
// so we use better-sqlite3 directly to execute each file.
function runMigrations(sqlite: Database.Database): void {
  const { readdirSync, readFileSync } = require('node:fs') as typeof import('node:fs')

  // In development, electron-vite doesn't copy *.sql assets to out/main/, so
  // we read directly from the source tree. In production, the build plugin copies
  // them alongside the compiled JS.
  const isDev = process.env.NODE_ENV === 'development'
  const migrationsDir = isDev
    ? join(__dirname, '../../src/main/db/migrations')
    : join(__dirname, 'migrations')

  // Track which migrations have already run
  sqlite
    .prepare(
      `CREATE TABLE IF NOT EXISTS __migrations (
        name TEXT PRIMARY KEY,
        ran_at TEXT NOT NULL
      )`
    )
    .run()

  const ran = new Set(
    sqlite
      .prepare('SELECT name FROM __migrations')
      .all()
      .map((r) => (r as { name: string }).name)
  )

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    if (ran.has(file)) continue

    const sql = readFileSync(join(migrationsDir, file), 'utf8')

    // Split on drizzle-kit's breakpoint marker or blank lines, then skip any
    // segment that contains only SQL comments (no actual statements to execute).
    const statements = sql
      .split(/(?:--> statement-breakpoint|\n{2,})/)
      .map((s) => s.trim())
      .filter((s) => {
        if (!s) return false
        // Strip -- line comments and check if anything real remains
        const stripped = s.replace(/--[^\n]*/g, '').trim()
        return stripped.length > 0
      })

    sqlite.transaction(() => {
      for (const stmt of statements) {
        sqlite.prepare(stmt).run()
      }
      sqlite
        .prepare('INSERT INTO __migrations (name, ran_at) VALUES (?, ?)')
        .run(file, new Date().toISOString())
    })()

    console.log(`[db] migration applied: ${file}`)
  }
}
