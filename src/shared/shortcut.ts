import type { ItemType, Platform } from './types'

export interface ShortcutPayload {
  type: ItemType
  content?: string
  sourceUrl?: string
  platform?: Platform
  // base64 data URL — only set for type='image'
  dataUrl?: string
}
