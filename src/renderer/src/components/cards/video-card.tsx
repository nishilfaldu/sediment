import type { JSX } from 'react'
import { ExternalLinkIcon } from '@/components/icons/external-link-icon'
import { PlayIcon } from '@/components/icons/play-icon'
import type { Item } from '@/types'

export interface VideoCardProps {
  item: Item
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

export const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo'
}

export function VideoCard({ item }: VideoCardProps): JSX.Element {
  const url = item.sourceUrl ?? ''
  const platform = item.platform ?? 'youtube'
  const label = PLATFORM_LABELS[platform] ?? platform

  // YouTube thumbnails are available immediately without a network fetch
  const ytId = platform === 'youtube' ? youtubeVideoId(url) : null
  const thumbnail =
    item.thumbnail ?? (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null)

  function open(): void {
    window.open(url, '_blank')
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Thumbnail with play button overlay */}
      {thumbnail && (
        <button
          type="button"
          onClick={open}
          className="-mx-4 -mt-5 mb-1 block overflow-hidden rounded-t-xl relative group/thumb"
          aria-label={`Play on ${label}`}
        >
          <img
            src={thumbnail}
            alt=""
            className="w-full object-cover"
            style={{ maxHeight: '180px' }}
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover/thumb:opacity-100 transition-opacity">
            <PlayIcon />
          </div>
        </button>
      )}

      {/* Title */}
      {item.title ? (
        <p className="text-sm font-medium leading-snug text-stone-800 line-clamp-2">{item.title}</p>
      ) : (
        <p className="text-sm text-stone-400 break-all line-clamp-1">{url}</p>
      )}

      {/* Footer: platform badge + open */}
      <div className="flex items-center justify-between pt-1">
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">
          {label}
        </span>
        <button
          type="button"
          onClick={open}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        >
          Open <ExternalLinkIcon />
        </button>
      </div>
    </div>
  )
}
