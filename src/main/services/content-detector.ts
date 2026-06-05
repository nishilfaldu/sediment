import type { ItemType, Platform } from '../db/schema'

export interface DetectedContent {
  type: ItemType
  content?: string // set for type='text'
  sourceUrl?: string // set for link/video/social
  platform?: Platform
}

/*
 * Classify a clipboard string into one of the item types.
 * Called synchronously in the global shortcut handler — no network access here;
 * OG metadata is fetched asynchronously in Phase 4 after the item is saved.
 */
export function detectContent(raw: string): DetectedContent {
  const text = raw.trim()

  // Try to parse as a URL. Only http/https are recognised — file:// etc. fall
  // through to plain text so we don't confuse local paths with web links.
  let url: URL | null = null
  try {
    url = new URL(text)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') url = null
  } catch {
    // Not a URL — treat as plain text
  }

  if (!url) return { type: 'text', content: text }

  const href = url.href
  // Strip leading "www." so hostname comparisons stay simple
  const host = url.hostname.replace(/^www\./, '')

  // --- Video ---
  if (host === 'youtube.com' && url.searchParams.get('v')) {
    return { type: 'video', sourceUrl: href, platform: 'youtube' }
  }
  if (host === 'youtu.be' && url.pathname.length > 1) {
    return { type: 'video', sourceUrl: href, platform: 'youtube' }
  }
  if (host === 'vimeo.com' && /^\/\d+/.test(url.pathname)) {
    return { type: 'video', sourceUrl: href, platform: 'vimeo' }
  }

  // --- Social ---
  if ((host === 'twitter.com' || host === 'x.com') && url.pathname.includes('/status/')) {
    return { type: 'social', sourceUrl: href, platform: 'twitter' }
  }
  if (host === 'instagram.com' && url.pathname.startsWith('/p/')) {
    return { type: 'social', sourceUrl: href, platform: 'instagram' }
  }
  if (host === 'bsky.app' && url.pathname.includes('/post/')) {
    return { type: 'social', sourceUrl: href, platform: 'bluesky' }
  }

  // --- Generic link (OG fetch in Phase 4) ---
  return { type: 'link', sourceUrl: href }
}
