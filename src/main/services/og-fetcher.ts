import { load } from 'cheerio'
import { eq } from 'drizzle-orm'
import { BrowserWindow } from 'electron'
import { getDb } from '../db'
import { items } from '../db/schema'

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

// Twitter/X blocks OG tag scraping; use their official oEmbed endpoint instead.
// Returns author handle as title and extracted tweet text as description.
async function fetchTwitterMeta(url: string): Promise<{
  title: string | null
  description: string | null
  thumbnail: string | null
  metadata: string | null
}> {
  const endpoint = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`
  const res = await fetch(endpoint, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Sediment/1.0)' },
    signal: AbortSignal.timeout(8000)
  })
  if (!res.ok) return { title: null, description: null, thumbnail: null, metadata: null }

  const data = (await res.json()) as {
    author_name?: string
    author_url?: string
    html?: string
  }

  // oEmbed HTML is a <blockquote> with the tweet text in a <p> tag
  const $ = load(data.html ?? '')
  const tweetText = $('blockquote > p').first().text().trim() || null

  return {
    title: data.author_name ? `@${data.author_name}` : null,
    description: tweetText,
    thumbnail: null,
    metadata: data.author_url ? JSON.stringify({ authorUrl: data.author_url }) : null
  }
}

// Vimeo's OG tags can be blocked; oEmbed is the official way to get metadata.
async function fetchVimeoMeta(url: string): Promise<{
  title: string | null
  description: string | null
  thumbnail: string | null
  metadata: string | null
}> {
  const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
  const res = await fetch(endpoint, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Sediment/1.0)' },
    signal: AbortSignal.timeout(8000)
  })
  if (!res.ok) return { title: null, description: null, thumbnail: null, metadata: null }

  const data = (await res.json()) as {
    title?: string
    description?: string
    thumbnail_url?: string
    author_name?: string
  }

  return {
    title: data.title ?? null,
    description: data.description ?? null,
    thumbnail: data.thumbnail_url ?? null,
    metadata: data.author_name ? JSON.stringify({ authorName: data.author_name }) : null
  }
}

function pushUpdate(itemId: string, dayId: string): void {
  BrowserWindow.getAllWindows()[0]?.webContents.send('item:metadataUpdated', { id: itemId, dayId })
}

// Fetches OG/oEmbed metadata for a URL and patches the item row.
// Failures are silently ignored — the item always lands on the board.
export async function fetchOgMetadata(itemId: string, dayId: string, url: string): Promise<void> {
  try {
    let meta: {
      title: string | null
      description: string | null
      thumbnail: string | null
      metadata: string | null
    }

    if (isTwitterUrl(url)) {
      meta = await fetchTwitterMeta(url)
    } else if (isVimeoUrl(url)) {
      meta = await fetchVimeoMeta(url)
    } else {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Sediment/1.0)' },
        signal: AbortSignal.timeout(8000)
      })
      if (!res.ok) return

      const html = await res.text()
      const $ = load(html)

      const pageTitle = $('title').first().text().trim() || null
      const title = getMeta($, 'og:title', 'twitter:title') ?? pageTitle
      const description = getMeta($, 'og:description', 'twitter:description', 'description')
      const thumbnail = getMeta($, 'og:image', 'twitter:image')
      const siteName = getMeta($, 'og:site_name')

      meta = {
        title,
        description,
        thumbnail,
        metadata: siteName ? JSON.stringify({ siteName }) : null
      }
    }

    getDb()
      .update(items)
      .set({ ...meta, updatedAt: Date.now() })
      .where(eq(items.id, itemId))
      .run()

    pushUpdate(itemId, dayId)
  } catch {
    // Network/parse failures are non-fatal
  }
}
