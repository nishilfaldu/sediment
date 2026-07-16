import type { Item } from '@/types'

export interface BoardItemProps {
  item: Item
  onDelete: () => void
  onUpdate?: (content: string) => void
  onNoteSave?: (note: string | null) => void
  selected?: boolean
  onToggleSelect?: () => void
  autoFocus?: boolean
}
