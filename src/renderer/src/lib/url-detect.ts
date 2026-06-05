import type { ItemType, Platform } from '@/types'

export interface UrlInfo {
  type: Exclude<ItemType, 'text' | 'image'>
  sourceUrl: string
  platform?: Platform
}

// Mirrors content-detector.ts (main process) but runs in the renderer.
// Kept as a separate copy because the renderer can't import main-process modules.
export function detectUrl(raw: string): UrlInfo | null {
  const text = raw.trim()
  let url: URL
  try {
    url = new URL(text)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  } catch {
    return null
  }

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
