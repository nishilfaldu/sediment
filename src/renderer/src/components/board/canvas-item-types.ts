import type { Item } from '@/types'

export interface CanvasItemProps {
  item: Item
  onDelete: () => void
  onUpdate: (content: string) => void
  autoFocus: boolean
}
