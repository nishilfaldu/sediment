import { PLATFORM_LABELS } from '@shared/labels'
import type { JSX } from 'react'
import { CardOpenButton } from '@/components/cards/card-open-button'
import { CardThumbnail } from '@/components/cards/card-thumbnail'
import type { Item } from '@/types'

export interface SocialCardProps {
  item: Item
}

const tagClass =
  'border border-ui bg-card/95 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-moss'

export function SocialCard({ item }: SocialCardProps): JSX.Element {
  const url = item.sourceUrl ?? ''
  const platform = item.platform ?? 'twitter'
  const label = PLATFORM_LABELS[platform] ?? platform

  return (
    <div className="flex flex-col">
      {item.thumbnail && (
        <CardThumbnail src={item.thumbnail} badge={<span className={tagClass}>{label}</span>} />
      )}

      <div className="flex flex-col gap-2 p-4">
        {!item.thumbnail && (
          <div>
            <span className={`inline-block ${tagClass}`}>{label}</span>
          </div>
        )}

        {item.title ? (
          <p className="text-sm font-medium leading-snug text-primary line-clamp-3">{item.title}</p>
        ) : (
          <p className="text-sm text-muted break-all line-clamp-2">{url}</p>
        )}

        {item.description && (
          <p className="text-xs leading-relaxed text-secondary line-clamp-3">{item.description}</p>
        )}

        <div className="flex justify-end pt-1">
          <CardOpenButton label="View post" url={url} />
        </div>
      </div>
    </div>
  )
}
