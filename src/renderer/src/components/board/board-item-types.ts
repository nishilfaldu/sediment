import type { Item } from '@/types'

export interface BoardItemProps {
  item: Item
  onDelete: () => void
  onUpdate?: (content: string) => void
  autoFocus?: boolean
}
