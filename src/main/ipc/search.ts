import { ipcMain } from 'electron'
import { getSqlite } from '../db'

export type SearchResult = {
  id: string
  dayId: string
  type: string
  title: string | null
  description: string | null
  content: string | null
  sourceUrl: string | null
  thumbnail: string | null
  createdAt: string
}

// Turn raw user input into a safe FTS5 MATCH expression.
// Passing user text straight to MATCH throws on FTS syntax characters
// (", *, :, -, parens…). We quote each token so punctuation is treated
// literally, then append * for prefix matching ("rea" finds "react").
function toMatchQuery(raw: string): string {
  const tokens = raw
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/"/g, '').trim())
    .filter((t) => t.length > 0)
  if (tokens.length === 0) return ''
  return tokens.map((t) => `"${t}"*`).join(' ')
}

export function registerSearchHandlers(): void {
  // Full-text search across all items using the FTS5 virtual table.
  // Returns up to 50 results sorted by relevance rank (best match first).
  ipcMain.handle('search:query', (_e, query: string): SearchResult[] => {
    const match = toMatchQuery(query)
    if (!match) return []

    // Quoting tokens covers most punctuation, but some inputs (e.g. tokens that
    // tokenize to nothing) can still make FTS5 raise a syntax error. Treat any
    // such failure as "no results" rather than rejecting the IPC and breaking
    // the search box for that keystroke.
    try {
      return getSqlite()
        .prepare(
          `SELECT
            i.id,
            i.day_id   AS dayId,
            i.type,
            i.title,
            i.description,
            i.content,
            i.source_url AS sourceUrl,
            i.thumbnail,
            i.created_at AS createdAt
          FROM items_fts
          JOIN items i ON items_fts.id = i.id
          WHERE items_fts MATCH ?
          ORDER BY rank
          LIMIT 50`
        )
        .all(match) as SearchResult[]
    } catch {
      return []
    }
  })
}
