import { getLinkPresentation } from './link-presentation'
import type { ItemType, Platform } from './types'

export const TYPE_LABELS: Record<ItemType, string> = {
  text: 'text',
  link: 'link'
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  arxiv: 'arXiv',
  bandcamp: 'Bandcamp',
  bluesky: 'Bluesky',
  dailymotion: 'Dailymotion',
  devto: 'DEV',
  discord: 'Discord',
  facebook: 'Facebook',
  figma: 'Figma',
  github: 'GitHub',
  gitlab: 'GitLab',
  hackernews: 'Hacker News',
  instagram: 'Instagram',
  itch: 'itch.io',
  kick: 'Kick',
  lemmy: 'Lemmy',
  linkedin: 'LinkedIn',
  mastodon: 'Mastodon',
  medium: 'Medium',
  mixcloud: 'Mixcloud',
  notion: 'Notion',
  npm: 'npm',
  patreon: 'Patreon',
  pinterest: 'Pinterest',
  producthunt: 'Product Hunt',
  pypi: 'PyPI',
  reddit: 'Reddit',
  rumble: 'Rumble',
  snapchat: 'Snapchat',
  soundcloud: 'SoundCloud',
  spotify: 'Spotify',
  stackoverflow: 'Stack Overflow',
  substack: 'Substack',
  telegram: 'Telegram',
  threads: 'Threads',
  tiktok: 'TikTok',
  tumblr: 'Tumblr',
  twitch: 'Twitch',
  twitter: 'X',
  vimeo: 'Vimeo',
  wikipedia: 'Wikipedia',
  youtube: 'YouTube'
}

/** Specimen-tag label for search, toasts, and cards. */
export function itemTagLabel(item: { type: ItemType; sourceUrl: string | null }): string {
  if (item.type === 'link' && item.sourceUrl) {
    return getLinkPresentation(item.sourceUrl).tagLabel
  }
  return TYPE_LABELS[item.type]
}
