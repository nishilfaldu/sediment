import type { ItemType } from './types'

/** Fields the renderer sends when creating or updating an item. */
export interface CreateItemPayload {
  dayId: string
  type: ItemType
  content?: string | null
  sourceUrl?: string | null
  title?: string | null
  description?: string | null
  thumbnail?: string | null
}
