// Shared types consumed by main, preload, and renderer.
// Mirrors src/main/db/schema.ts — kept here so the renderer never imports
// main-process modules (which transitively pull in better-sqlite3).

export const ITEM_TYPES = ['text', 'link'] as const
export type ItemType = (typeof ITEM_TYPES)[number]

/** Known hosts for link presentation tags — derived from sourceUrl, not stored. */
export const PLATFORMS = [
  'arxiv',
  'bandcamp',
  'bluesky',
  'dailymotion',
  'devto',
  'discord',
  'facebook',
  'figma',
  'github',
  'gitlab',
  'hackernews',
  'instagram',
  'itch',
  'kick',
  'lemmy',
  'linkedin',
  'mastodon',
  'medium',
  'mixcloud',
  'notion',
  'npm',
  'patreon',
  'pinterest',
  'producthunt',
  'pypi',
  'reddit',
  'rumble',
  'snapchat',
  'soundcloud',
  'spotify',
  'stackoverflow',
  'substack',
  'telegram',
  'threads',
  'tiktok',
  'tumblr',
  'twitch',
  'twitter',
  'vimeo',
  'wikipedia',
  'youtube'
] as const
export type Platform = (typeof PLATFORMS)[number]

export interface Day {
  id: string
}

export interface Item {
  id: string
  dayId: string
  type: ItemType
  content: string | null
  sourceUrl: string | null
  title: string | null
  description: string | null
  thumbnail: string | null
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
