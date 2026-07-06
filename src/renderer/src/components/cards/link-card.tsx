import type { JSX } from 'react'
import { CardOpenButton } from '@/components/cards/card-open-button'
import { CardThumbnail } from '@/components/cards/card-thumbnail'
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
        <CardThumbnail
          src={item.thumbnail}
          badge={
            <span className="border border-ui bg-card/95 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-moss">
              Link
            </span>
          }
        />
      )}

      <div className="flex flex-col gap-2 p-4">
        {hasMeta ? (
          <p className="text-sm font-medium leading-snug text-primary line-clamp-2">{item.title}</p>
        ) : (
          <p className="text-sm text-muted break-all line-clamp-2">{url}</p>
        )}

        {item.description && (
          <p className="text-xs leading-relaxed text-secondary line-clamp-3">{item.description}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="font-mono text-[10.5px] text-muted">{domain(url)}</span>
          <CardOpenButton url={url} />
        </div>
      </div>
    </div>
  )
}
