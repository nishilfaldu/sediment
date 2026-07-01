import { ipcMain } from 'electron'
import type { SearchResult } from '@shared/types'
import { getSqlite } from '../db'

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
  ipcMain.handle('search:query', (_e, query: string): SearchResult[] => {
    const match = toMatchQuery(query)
    if (!match) return []

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
