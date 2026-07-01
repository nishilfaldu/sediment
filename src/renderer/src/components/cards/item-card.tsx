import type { JSX } from 'react'
import { ImageCard } from '@/components/cards/image-card'
import { LinkCard } from '@/components/cards/link-card'
import { SocialCard } from '@/components/cards/social-card'
import { VideoCard } from '@/components/cards/video-card'
import { CardSkeleton } from '@/components/cards/card-skeleton'
import { isMetadataLoading } from '@/lib/item-meta'
import type { Item } from '@/types'

export interface ItemCardProps {
  item: Item
}

export function ItemCard({ item }: ItemCardProps): JSX.Element {
  if (isMetadataLoading(item)) {
    return <CardSkeleton />
  }

  switch (item.type) {
    case 'link':
      return <LinkCard item={item} />
    case 'video':
      return <VideoCard item={item} />
    case 'social':
      return <SocialCard item={item} />
    case 'image':
      return <ImageCard item={item} />
    case 'text':
      return <p className="p-4 text-sm text-stone-400">Unexpected text item in card view</p>
    default: {
      const _exhaustive: never = item.type
      return _exhaustive
    }
  }
}
