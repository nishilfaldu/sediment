import type { ItemType, Platform } from './types'

// Payload the renderer sends when creating or updating an item.
export interface CreateItemPayload {
  dayId: string
  type: ItemType
  content?: string | null
  sourceUrl?: string | null
  platform?: Platform | null
  title?: string | null
  description?: string | null
  thumbnail?: string | null
  metadata?: string | null
  x?: number
  y?: number
}

export interface MetadataPatch {
  title: string | null
  description: string | null
  thumbnail: string | null
  metadata: string | null
}
