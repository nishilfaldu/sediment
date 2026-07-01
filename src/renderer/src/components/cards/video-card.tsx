import { PLATFORM_LABELS } from '@shared/labels'
import type { JSX } from 'react'
import { CardOpenButton } from '@/components/cards/card-open-button'
import { CardThumbnail } from '@/components/cards/card-thumbnail'
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

export function VideoCard({ item }: VideoCardProps): JSX.Element {
  const url = item.sourceUrl ?? ''
  const platform = item.platform ?? 'youtube'
  const label = PLATFORM_LABELS[platform] ?? platform

  const ytId = platform === 'youtube' ? youtubeVideoId(url) : null
  const thumbnail =
    item.thumbnail ?? (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null)

  function open(): void {
    window.open(url, '_blank')
  }

  return (
    <div className="flex flex-col">
      {thumbnail && (
        <CardThumbnail
          src={thumbnail}
          onClick={open}
          buttonLabel={`Play on ${label}`}
          badge={
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-stone-600 shadow-sm dark:bg-stone-900/90 dark:text-stone-300">
              {label}
            </span>
          }
          overlay={
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-stone-900/10">
              <PlayIcon />
            </div>
          }
        />
      )}

      <div className="flex flex-col gap-2 p-4">
        {item.title ? (
          <p className="text-sm font-medium leading-snug text-stone-800 line-clamp-2 dark:text-stone-100">
            {item.title}
          </p>
        ) : (
          <p className="text-sm text-stone-400 break-all line-clamp-1 dark:text-stone-500">{url}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          {!thumbnail && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500 dark:bg-stone-800 dark:text-stone-400">
              {label}
            </span>
          )}
          <div className={thumbnail ? 'ml-auto' : ''}>
            <CardOpenButton url={url} />
          </div>
        </div>
      </div>
    </div>
  )
}
