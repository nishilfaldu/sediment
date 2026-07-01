import { PLATFORM_COLOURS, PLATFORM_LABELS } from '@shared/labels'
import type { JSX } from 'react'
import { CardOpenButton } from '@/components/cards/card-open-button'
import type { Item } from '@/types'

export interface SocialCardProps {
  item: Item
}

export function SocialCard({ item }: SocialCardProps): JSX.Element {
  const url = item.sourceUrl ?? ''
  const platform = item.platform ?? 'twitter'
  const label = PLATFORM_LABELS[platform] ?? platform
  const colourClass = PLATFORM_COLOURS[platform] ?? 'bg-stone-200 text-stone-600'

  return (
    <div className="flex flex-col">
      {item.thumbnail && (
        <img src={item.thumbnail} alt="" className="h-40 w-full object-cover" loading="lazy" />
      )}

      <div className="flex flex-col gap-2 p-4">
        <div>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colourClass}`}
          >
            {label}
          </span>
        </div>

        {item.title ? (
          <p className="text-sm font-medium leading-snug text-stone-800 line-clamp-3">
            {item.title}
          </p>
        ) : (
          <p className="text-sm text-stone-400 break-all line-clamp-2">{url}</p>
        )}

        {item.description && (
          <p className="text-xs leading-relaxed text-stone-500 line-clamp-3">{item.description}</p>
        )}

        <div className="flex justify-end pt-1">
          <CardOpenButton label="View post" url={url} />
        </div>
      </div>
    </div>
  )
}
