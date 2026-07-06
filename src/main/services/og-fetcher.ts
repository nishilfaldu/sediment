import type { OgMetadataPatch } from '@shared/contracts'
import { load } from 'cheerio'
import { BrowserWindow } from 'electron'
import { patchItemMetadata } from './item-metadata'

function getMeta($: ReturnType<typeof load>, ...props: string[]): string | null {
  for (const prop of props) {
    const val =
      $(`meta[property="${prop}"]`).attr('content') ?? $(`meta[name="${prop}"]`).attr('content')
    if (val?.trim()) return val.trim()
  }
  return null
}

function isTwitterUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return host === 'twitter.com' || host === 'x.com'
  } catch {
    return false
  }
}

function isVimeoUrl(url: string): boolean {
  try {
    return new URL(url).hostname.replace(/^www\./, '') === 'vimeo.com'
  } catch {
    return false
  }
}

const EMPTY: OgMetadataPatch = { title: null, description: null, thumbnail: null }

async function fetchTwitterMeta(url: string): Promise<OgMetadataPatch> {
  const endpoint = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`
  const res = await fetch(endpoint, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Sediment/1.0)' },
    signal: AbortSignal.timeout(8000)
  })
  if (!res.ok) return EMPTY

  const data = (await res.json()) as {
    author_name?: string
    html?: string
  }

  const $ = load(data.html ?? '')
  const tweetText = $('blockquote > p').first().text().trim() || null

  return {
    title: data.author_name ? `@${data.author_name}` : null,
    description: tweetText,
    thumbnail: null
  }
}

async function fetchVimeoMeta(url: string): Promise<OgMetadataPatch> {
  const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
  const res = await fetch(endpoint, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Sediment/1.0)' },
    signal: AbortSignal.timeout(8000)
  })
  if (!res.ok) return EMPTY

  const data = (await res.json()) as {
    title?: string
    description?: string
    thumbnail_url?: string
  }

  return {
    title: data.title ?? null,
    description: data.description ?? null,
    thumbnail: data.thumbnail_url ?? null
  }
}

function pushUpdate(itemId: string, dayId: string): void {
  BrowserWindow.getAllWindows()[0]?.webContents.send('item:metadataUpdated', { id: itemId, dayId })
}

export async function fetchUrlMetadata(url: string): Promise<OgMetadataPatch> {
  if (isTwitterUrl(url)) {
    return fetchTwitterMeta(url)
  }
  if (isVimeoUrl(url)) {
    return fetchVimeoMeta(url)
  }

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Sediment/1.0)' },
    signal: AbortSignal.timeout(8000)
  })
  if (!res.ok) return EMPTY

  const html = await res.text()
  const $ = load(html)

  const pageTitle = $('title').first().text().trim() || null

  return {
    title: getMeta($, 'og:title', 'twitter:title') ?? pageTitle,
    description: getMeta($, 'og:description', 'twitter:description', 'description'),
    thumbnail: getMeta($, 'og:image', 'twitter:image')
  }
}

export async function fetchOgMetadata(itemId: string, dayId: string, url: string): Promise<void> {
  try {
    const meta = await fetchUrlMetadata(url)
    patchItemMetadata(itemId, meta)
    pushUpdate(itemId, dayId)
  } catch {
    // Network/parse failures are non-fatal
  }
}
