import type { CreateItemPayload, MetadataPatch } from './contracts'
import type { ShortcutPayload } from './shortcut'
import type { Day, Item, SearchResult } from './types'

export type { CreateItemPayload, MetadataPatch } from './contracts'
export type { ShortcutPayload } from './shortcut'

export interface ExportResult {
  saved: boolean
  filePath?: string
}

export interface Api {
  items: {
    getByDay: (dayId: string) => Promise<Item[]>
    create: (payload: CreateItemPayload) => Promise<Item>
    update: (id: string, patch: Partial<CreateItemPayload>) => Promise<Item>
    delete: (id: string) => Promise<void>
  }
  days: {
    list: () => Promise<Day[]>
    getOrCreate: (dayId: string) => Promise<Day>
  }
  search: {
    query: (q: string) => Promise<SearchResult[]>
  }
  metadata: {
    preview: (url: string) => Promise<MetadataPatch>
  }
  export: {
    day: (dayId: string) => Promise<ExportResult>
    copyMarkdown: (dayId: string) => Promise<void>
    openInAi: (dayId: string, provider: 'chatgpt' | 'claude') => Promise<void>
  }
  on: {
    shortcutTriggered: (cb: (payload: ShortcutPayload) => void) => () => void
    itemMetadataUpdated: (cb: (payload: { id: string; dayId: string }) => void) => () => void
  }
}
