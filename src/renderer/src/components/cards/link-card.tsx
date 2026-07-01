import type { JSX } from 'react'
import { CardOpenButton } from '@/components/cards/card-open-button'
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

  return (
    <div className="flex flex-col">
      {item.thumbnail && (
        <img src={item.thumbnail} alt="" className="h-40 w-full object-cover" loading="lazy" />
      )}

      <div className="flex flex-col gap-2 p-4">
        {hasMeta ? (
          <p className="text-sm font-medium leading-snug text-stone-800 line-clamp-2">
            {item.title}
          </p>
        ) : (
          <p className="text-sm text-stone-400 break-all line-clamp-2">{url}</p>
        )}

        {item.description && (
          <p className="text-xs leading-relaxed text-stone-500 line-clamp-3">{item.description}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-stone-400">{domain(url)}</span>
          <CardOpenButton url={url} />
        </div>
      </div>
    </div>
  )
}
