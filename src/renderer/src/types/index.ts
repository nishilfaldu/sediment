// These mirror the Drizzle inferred types from src/main/db/schema.ts.
// Deliberately kept separate — the renderer must never import from the main
// process (Vite/Chromium cannot bundle native Node modules like better-sqlite3
// that schema.ts transitively pulls in). IPC is the contract between them.

export type ItemType = 'text' | 'image' | 'link' | 'video' | 'social'
export type Platform = 'youtube' | 'vimeo' | 'twitter' | 'instagram' | 'bluesky'
export type WidthHint = 'small' | 'medium' | 'large'

export interface Item {
  id: string
  dayId: string
  type: ItemType
  content: string | null
  sourceUrl: string | null
  title: string | null
  description: string | null
  thumbnail: string | null
  imagePath: string | null
  platform: Platform | null
  metadata: string | null
  x: number
  y: number
  position: number
  widthHint: WidthHint
  // UTC epoch milliseconds — convert to local time for display: new Date(ms)
  createdAt: number
  updatedAt: number
}

// A single full-text search hit. Mirrors SearchResult in src/main/ipc/search.ts.
// createdAt is a string here because SQLite returns the raw column value.
export interface SearchResult {
  id: string
  dayId: string
  type: ItemType
  title: string | null
  description: string | null
  content: string | null
  sourceUrl: string | null
  thumbnail: string | null
  createdAt: string
}

export interface Day {
  id: string // local calendar date: "2026-05-26"
  note: string | null
  createdAt: number
  updatedAt: number
}
