import type { ItemType, Platform } from './types'

export interface ClipboardCapturePayload {
  id: string
  dayId: string
  type: Exclude<ItemType, 'text' | 'image'>
  sourceUrl: string
  platform?: Platform
}

export interface ClipboardDuplicatePayload {
  dayId: string
  sourceUrl: string
}
