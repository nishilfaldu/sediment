// Shared types consumed by main, preload, and renderer.

import type { Doc } from '../../convex/_generated/dataModel'

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

/** Convex item document — single source of truth from the schema. */
export type Item = Doc<'items'>

export type SearchResult = Item
