import { readFileSync } from 'node:fs'
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

  ensureSchema(sqlite)
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

// Applies ensure-schema.sql on every startup. Every statement is idempotent
// (IF NOT EXISTS), so there is no migration ledger or filename tracking.
function ensureSchema(sqlite: Database.Database): void {
  const isDev = process.env.NODE_ENV === 'development'
  const schemaPath = isDev
    ? join(__dirname, '../../src/main/db/ensure-schema.sql')
    : join(__dirname, 'ensure-schema.sql')

  const sql = readFileSync(schemaPath, 'utf8')
  const statements = sql
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter((s) => {
      if (!s) return false
      const stripped = s.replace(/--[^\n]*/g, '').trim()
      return stripped.length > 0
    })

  for (const stmt of statements) {
    sqlite.prepare(stmt).run()
  }
}
