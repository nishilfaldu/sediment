import type { JSX } from 'react'
import { ExternalLinkIcon } from '@/components/icons/external-link-icon'
import type { Item, Platform } from '@/types'

export interface SocialCardProps {
  item: Item
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  twitter: 'X / Twitter',
  instagram: 'Instagram',
  bluesky: 'Bluesky',
  youtube: 'YouTube',
  vimeo: 'Vimeo'
}

// Colour badges that match each platform's brand without adding heavy deps
export const PLATFORM_COLOURS: Record<Platform, string> = {
  twitter: 'bg-stone-900 text-white',
  instagram: 'bg-pink-500 text-white',
  bluesky: 'bg-sky-500 text-white',
  youtube: 'bg-red-600 text-white',
  vimeo: 'bg-cyan-600 text-white'
}

export function SocialCard({ item }: SocialCardProps): JSX.Element {
  const url = item.sourceUrl ?? ''
  const platform = item.platform ?? 'twitter'
  const label = PLATFORM_LABELS[platform] ?? platform
  const colourClass = PLATFORM_COLOURS[platform] ?? 'bg-stone-200 text-stone-600'

  function open(): void {
    window.open(url, '_blank')
  }

  return (
    <div className="flex flex-col gap-2">
      {/* OG image if available */}
      {item.thumbnail && (
        <div className="-mx-4 -mt-5 mb-1 overflow-hidden rounded-t-xl">
          <img
            src={item.thumbnail}
            alt=""
            className="w-full object-cover"
            style={{ maxHeight: '160px' }}
            loading="lazy"
          />
        </div>
      )}

      {/* Platform badge */}
      <div>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colourClass}`}
        >
          {label}
        </span>
      </div>

      {/* Title / description from OG, or raw URL as fallback */}
      {item.title ? (
        <p className="text-sm font-medium leading-snug text-stone-800 line-clamp-3">{item.title}</p>
      ) : (
        <p className="text-sm text-stone-400 break-all line-clamp-2">{url}</p>
      )}

      {item.description && (
        <p className="text-xs leading-relaxed text-stone-500 line-clamp-3">{item.description}</p>
      )}

      {/* Open button */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={open}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        >
          View post <ExternalLinkIcon />
        </button>
      </div>
    </div>
  )
}
