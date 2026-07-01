import type { JSX } from 'react'
import { PLATFORM_LABELS, TYPE_LABELS } from '@shared/labels'
import type { MetadataPatch } from '@shared/contracts'
import type { ItemType, Platform } from '@/types'

export interface LinkPreviewProps {
  url: string
  type: Exclude<ItemType, 'text' | 'image'>
  platform?: Platform
  metadata?: MetadataPatch | null
  loading?: boolean
}

function domain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function youtubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1).split('?')[0]
    return parsed.searchParams.get('v')
  } catch {
    return null
  }
}

function previewThumbnail(
  type: LinkPreviewProps['type'],
  platform: Platform | undefined,
  url: string,
  metadata?: MetadataPatch | null
): string | null {
  if (metadata?.thumbnail) return metadata.thumbnail
  if (type === 'video' && platform === 'youtube') {
    const id = youtubeVideoId(url)
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  }
  return null
}

export function LinkPreview({
  url,
  type,
  platform,
  metadata,
  loading = false
}: LinkPreviewProps): JSX.Element {
  const thumbnail = previewThumbnail(type, platform, url, metadata)
  const title = metadata?.title?.trim()
  const description = metadata?.description?.trim()
  const platformLabel = platform ? (PLATFORM_LABELS[platform] ?? platform) : null

  return (
    <div className="overflow-hidden rounded-xl border border-stone-100 bg-stone-50">
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          className="h-40 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-stone-100 text-sm text-stone-300">
          {loading ? 'Fetching preview…' : 'No preview image'}
        </div>
      )}

      <div className="space-y-2 p-4">
        <div className="flex items-center gap-2">
          <span className="rounded bg-white px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-stone-500 ring-1 ring-stone-100">
            {TYPE_LABELS[type]}
          </span>
          {platformLabel && (
            <span className="text-[10px] uppercase tracking-wide text-stone-400">
              {platformLabel}
            </span>
          )}
        </div>

        <p className="text-sm font-medium leading-snug text-stone-800 line-clamp-2">
          {title || url}
        </p>

        {description && (
          <p className="text-xs leading-relaxed text-stone-500 line-clamp-3">{description}</p>
        )}

        <p className="text-xs text-stone-400">{domain(url)}</p>
      </div>
    </div>
  )
}
