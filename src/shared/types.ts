// Shared types consumed by main, preload, and renderer.
// Mirrors src/main/db/schema.ts — kept here so the renderer never imports
// main-process modules (which transitively pull in better-sqlite3).

export const ITEM_TYPES = ['text', 'image', 'link', 'video', 'social'] as const
export type ItemType = (typeof ITEM_TYPES)[number]

export const PLATFORMS = ['youtube', 'vimeo', 'twitter', 'instagram', 'bluesky'] as const
export type Platform = (typeof PLATFORMS)[number]

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
  createdAt: number
  updatedAt: number
}

export interface Day {
  id: string
  note: string | null
  createdAt: number
  updatedAt: number
}

// createdAt is a string because SQLite returns the raw column value from FTS joins.
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
