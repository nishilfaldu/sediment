'use node'

import { v } from 'convex/values'
import { load } from 'cheerio'
import { internal } from './_generated/api'
import { internalAction } from './_generated/server'

type OgMetadataPatch = {
  title: string | null
  description: string | null
  thumbnail: string | null
}

const EMPTY: OgMetadataPatch = { title: null, description: null, thumbnail: null }

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

async function fetchUrlMetadata(url: string): Promise<OgMetadataPatch> {
  if (isTwitterUrl(url)) return fetchTwitterMeta(url)
  if (isVimeoUrl(url)) return fetchVimeoMeta(url)

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

export const fetchAndPatch = internalAction({
  args: {
    itemId: v.id('items'),
    sourceUrl: v.string()
  },
  handler: async (ctx, { itemId, sourceUrl }) => {
    try {
      const meta = await fetchUrlMetadata(sourceUrl)
      await ctx.runMutation(internal.items.patchMetadata, {
        id: itemId,
        title: meta.title,
        description: meta.description,
        thumbnail: meta.thumbnail
      })
    } catch {
      // Network/parse failures are non-fatal
    }
  }
})
