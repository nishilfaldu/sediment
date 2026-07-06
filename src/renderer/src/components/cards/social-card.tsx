import { PLATFORM_LABELS } from '@shared/labels'
import type { JSX } from 'react'
import { CardOpenButton } from '@/components/cards/card-open-button'
import { CardThumbnail } from '@/components/cards/card-thumbnail'
import { SpecimenTag } from '@/components/ui/specimen-tag'
import type { Item } from '@/types'

export interface SocialCardProps {
  item: Item
}

export function SocialCard({ item }: SocialCardProps): JSX.Element {
  const url = item.sourceUrl ?? ''
  const platform = item.platform ?? 'twitter'
  const label = PLATFORM_LABELS[platform] ?? platform

  return (
    <div className="flex flex-col">
      {item.thumbnail && (
        <CardThumbnail src={item.thumbnail} badge={<SpecimenTag overlay>{label}</SpecimenTag>} />
      )}

      <div className="flex flex-col gap-2 p-4">
        {!item.thumbnail && (
          <div>
            <SpecimenTag className="inline-block">{label}</SpecimenTag>
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
          <CardOpenButton url={url} />
        </div>
      </div>
    </div>
  )
}
