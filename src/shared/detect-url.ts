import type { ItemType, Platform } from './types'

export interface DetectedContent {
  type: ItemType
  content?: string
  sourceUrl?: string
  platform?: Platform
}

export interface UrlDetection {
  type: Exclude<ItemType, 'text' | 'image'>
  sourceUrl: string
  platform?: Platform
}

/*
 * Classify a string into one of the item types.
 * Runs synchronously — no network access. OG metadata is fetched asynchronously
 * after the item is saved.
 */
export function detectContent(raw: string): DetectedContent {
  const text = raw.trim()

  // Only http/https are recognised — file:// etc. fall through to plain text.
  let url: URL | null = null
  try {
    url = new URL(text)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') url = null
  } catch {
    // Not a URL — treat as plain text
  }

  if (!url) return { type: 'text', content: text }

  const href = url.href
  const host = url.hostname.replace(/^www\./, '')

  if (host === 'youtube.com' && url.searchParams.get('v')) {
    return { type: 'video', sourceUrl: href, platform: 'youtube' }
  }
  if (host === 'youtu.be' && url.pathname.length > 1) {
    return { type: 'video', sourceUrl: href, platform: 'youtube' }
  }
  if (host === 'vimeo.com' && /^\/\d+/.test(url.pathname)) {
    return { type: 'video', sourceUrl: href, platform: 'vimeo' }
  }
  if ((host === 'twitter.com' || host === 'x.com') && url.pathname.includes('/status/')) {
    return { type: 'social', sourceUrl: href, platform: 'twitter' }
  }
  if (host === 'instagram.com' && url.pathname.startsWith('/p/')) {
    return { type: 'social', sourceUrl: href, platform: 'instagram' }
  }
  if (host === 'bsky.app' && url.pathname.includes('/post/')) {
    return { type: 'social', sourceUrl: href, platform: 'bluesky' }
  }

  return { type: 'link', sourceUrl: href }
}

// Returns null when the input is plain text (not a URL).
export function detectUrl(raw: string): UrlDetection | null {
  const detected = detectContent(raw)
  if (detected.type === 'text' || detected.type === 'image') return null
  return {
    type: detected.type,
    sourceUrl: detected.sourceUrl as string,
    platform: detected.platform
  }
}
