export interface ClipboardCapturePayload {
  id: string
  dayId: string
  sourceUrl: string
  /** When false, the main window should skip its toast (background overlay handles it). */
  showInAppToast: boolean
}

export interface ClipboardDuplicatePayload {
  dayId: string
  sourceUrl: string
  showInAppToast: boolean
}

/** Payload pushed into the floating capture-toast window. */
export interface CaptureToastShow {
  message: string
  tagLabel?: string
  detail?: string
  thumbnailUrl?: string | null
  canUndo: boolean
  durationMs: number
}
