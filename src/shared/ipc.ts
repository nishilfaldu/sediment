import type { ClipboardCapturePayload } from './clipboard-capture'
import type { CreateItemPayload, MetadataPatch } from './contracts'
import type { Day, Item, SearchResult } from './types'

export type { ClipboardCapturePayload } from './clipboard-capture'
export type { CreateItemPayload, MetadataPatch } from './contracts'

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
  clipboard: {
    suppress: (url: string) => Promise<void>
  }
  on: {
    clipboardCaptured: (cb: (payload: ClipboardCapturePayload) => void) => () => void
    itemMetadataUpdated: (cb: (payload: { id: string; dayId: string }) => void) => () => void
  }
}
