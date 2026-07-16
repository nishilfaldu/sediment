import type {
  CaptureToastShow,
  ClipboardCandidatePayload,
  ClipboardUndoPayload
} from './clipboard-capture'

export type {
  CaptureToastShow,
  ClipboardCandidatePayload,
  ClipboardUndoPayload
} from './clipboard-capture'
export type { CreateItemPayload } from './contracts'
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

/** OS-only bridge — item/day/search CRUD lives in Convex. */
export interface Api {
  export: {
    saveMarkdown: (defaultPath: string, markdown: string) => Promise<ExportResult>
    copyText: (text: string) => Promise<void>
    openAi: (provider: 'chatgpt' | 'claude', prompt: string) => Promise<void>
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
    showOverlay: (payload: {
      id: string
      dayId: string
      sourceUrl: string
    }) => Promise<void>
    showDuplicateOverlay: (sourceUrl: string) => Promise<void>
  }
  on: {
    clipboardCandidate: (cb: (payload: ClipboardCandidatePayload) => void) => () => void
    clipboardUndoRequest: (cb: (payload: ClipboardUndoPayload) => void) => () => void
    captureToastShow: (cb: (payload: CaptureToastShow) => void) => () => void
  }
}
