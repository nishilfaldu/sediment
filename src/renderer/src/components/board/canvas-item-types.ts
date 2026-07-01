import type { Item, ItemType, Platform } from '@/types'

export interface CanvasItemProps {
  item: Item
  onDelete: () => void
  onUpdate: (content: string) => void
  onUpgrade: (type: ItemType, sourceUrl: string, platform?: Platform) => void
  onMove: (x: number, y: number) => void
  onBringToFront: () => void
  autoFocus: boolean
}
