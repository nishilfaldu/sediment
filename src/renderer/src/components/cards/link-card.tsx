import type { JSX } from 'react'
import { ExternalLinkIcon } from '@/components/icons/external-link-icon'
import type { Item } from '@/types'

export interface LinkCardProps {
  item: Item
}

function domain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function LinkCard({ item }: LinkCardProps): JSX.Element {
  const url = item.sourceUrl ?? ''
  const hasMeta = Boolean(item.title)

  function open(): void {
    window.open(url, '_blank')
  }

  return (
    <div className="flex flex-col gap-2">
      {/* OG image — only rendered once metadata arrives */}
      {item.thumbnail && (
        <div className="-mx-4 -mt-5 mb-1 overflow-hidden rounded-t-xl">
          <img
            src={item.thumbnail}
            alt=""
            className="w-full object-cover"
            style={{ maxHeight: '180px' }}
            loading="lazy"
          />
        </div>
      )}

      {/* Title */}
      {hasMeta ? (
        <p className="text-sm font-medium leading-snug text-stone-800 line-clamp-2">{item.title}</p>
      ) : (
        <p className="text-sm text-stone-400 break-all line-clamp-2">{url}</p>
      )}

      {/* Description */}
      {item.description && (
        <p className="text-xs leading-relaxed text-stone-500 line-clamp-3">{item.description}</p>
      )}

      {/* Footer: domain + open button */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-stone-400">{domain(url)}</span>
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
