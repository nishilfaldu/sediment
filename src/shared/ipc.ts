import type {
  CaptureToastShow,
  ClipboardCapturePayload,
  ClipboardDuplicatePayload
} from './clipboard-capture'
import type { CreateItemPayload } from './contracts'
import type { DaySummary } from './day-summary'
import type { Day, Item, SearchResult } from './types'

export type {
  CaptureToastShow,
  ClipboardCapturePayload,
  ClipboardDuplicatePayload
} from './clipboard-capture'
export type { CreateItemPayload, OgMetadataPatch } from './contracts'
export type { DaySummary } from './day-summary'

export interface ExportResult {
  saved: boolean
  filePath?: string
}

export interface AppSettings {
  globalHotkey: string | null
}

export interface SetHotkeyResult {
  ok: boolean
  globalHotkey: string | null
  error: string | null
}

export interface Api {
  items: {
    getByDay: (dayId: string) => Promise<Item[]>
    create: (payload: CreateItemPayload) => Promise<Item>
    update: (id: string, patch: Partial<CreateItemPayload>) => Promise<Item>
    delete: (id: string) => Promise<void>
  }
  days: {
    list: () => Promise<DaySummary[]>
    getOrCreate: (dayId: string) => Promise<Day>
  }
  search: {
    query: (q: string) => Promise<SearchResult[]>
  }
  export: {
    day: (dayId: string) => Promise<ExportResult>
    copyMarkdown: (dayId: string) => Promise<void>
    copyForFriend: (dayId: string) => Promise<void>
    copyItemsForFriend: (ids: string[]) => Promise<void>
    copyItemsMarkdown: (ids: string[]) => Promise<void>
    openInAi: (dayId: string, provider: 'chatgpt' | 'claude') => Promise<void>
    openItemsInAi: (ids: string[], provider: 'chatgpt' | 'claude') => Promise<void>
  }
  settings: {
    get: () => Promise<AppSettings>
    setGlobalHotkey: (accelerator: string | null) => Promise<SetHotkeyResult>
  }
  clipboard: {
    suppress: (url: string) => Promise<void>
  }
  captureToast: {
    undo: () => Promise<void>
    dismiss: () => Promise<void>
    ready: () => Promise<void>
  }
  on: {
    clipboardCaptured: (cb: (payload: ClipboardCapturePayload) => void) => () => void
    clipboardDuplicate: (cb: (payload: ClipboardDuplicatePayload) => void) => () => void
    clipboardUndone: (cb: (payload: { dayId: string }) => void) => () => void
    itemMetadataUpdated: (cb: (payload: { id: string; dayId: string }) => void) => () => void
    captureToastShow: (cb: (payload: CaptureToastShow) => void) => () => void
  }
}
