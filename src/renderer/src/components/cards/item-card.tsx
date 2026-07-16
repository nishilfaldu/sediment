import { isAwaitingOgMetadata } from '@shared/item-metadata'
import type { JSX } from 'react'
import { CardSkeleton } from '@/components/cards/card-skeleton'
import { LinkCard } from '@/components/cards/link-card'
import type { Item } from '@/types'

export interface ItemCardProps {
  item: Item
  onNoteSave?: (note: string | null) => void
}

export function ItemCard({ item, onNoteSave }: ItemCardProps): JSX.Element {
  if (item.type === 'link' && isAwaitingOgMetadata(item)) {
    return <CardSkeleton />
  }

  switch (item.type) {
    case 'link':
      return <LinkCard item={item} onNoteSave={onNoteSave} />
    case 'text':
      return <p className="p-4 text-sm text-muted">Unexpected text item in card view</p>
    default: {
      const _exhaustive: never = item.type
      return _exhaustive
    }
  }
}
