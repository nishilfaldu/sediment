import type { ClipboardCapturePayload } from '@shared/clipboard-capture'
import { todayId } from '@shared/dates'
import type { DetectedLink } from '@shared/detect-url'
import { detectUrl } from '@shared/detect-url'
import { type BrowserWindow, clipboard, ipcMain } from 'electron'
import { registerCaptureToast, showCaptureOverlay, showDuplicateOverlay } from './capture-toast'
import { createItemRecord, hasSourceUrlOnDay } from './create-item'
import { isMainWindowForeground } from './main-window'

const POLL_MS = 500
const SUPPRESS_MS = 30_000
const OWN_WRITE_MS = 1_500

let pollTimer: ReturnType<typeof setInterval> | null = null
let lastClipboardText = ''
let ignoreOwnWritesUntil = 0
const suppressedUrls = new Map<string, number>()
let lastDuplicateUrl = ''

function isSuppressed(url: string): boolean {
  const until = suppressedUrls.get(url)
  if (!until) return false
  if (Date.now() > until) {
    suppressedUrls.delete(url)
    return false
  }
  return true
}

export function suppressClipboardUrl(url: string, ms = SUPPRESS_MS): void {
  suppressedUrls.set(url, Date.now() + ms)
}

// Call before Sediment writes to the clipboard so the watcher ignores its own output.
export function ignoreNextClipboardWrites(ms = OWN_WRITE_MS): void {
  ignoreOwnWritesUntil = Date.now() + ms
}

function pruneSuppressed(): void {
  const now = Date.now()
  for (const [url, until] of suppressedUrls) {
    if (now > until) suppressedUrls.delete(url)
  }
}

function notifyCapture(win: BrowserWindow, payload: ClipboardCapturePayload): void {
  win.webContents.send('clipboard:captured', payload)
}

function notifyDuplicate(
  win: BrowserWindow,
  dayId: string,
  sourceUrl: string,
  showInAppToast: boolean
): void {
  win.webContents.send('clipboard:duplicate', { dayId, sourceUrl, showInAppToast })
}

type CaptureResult = 'captured' | 'duplicate' | 'skipped'

function captureUrlToToday(
  detected: DetectedLink,
  getWindow: () => BrowserWindow | null
): CaptureResult {
  const dayId = todayId()
  const win = getWindow()
  const foreground = isMainWindowForeground(win)

  if (hasSourceUrlOnDay(dayId, detected.sourceUrl)) {
    if (lastDuplicateUrl === detected.sourceUrl) return 'duplicate'
    lastDuplicateUrl = detected.sourceUrl
    if (win) {
      notifyDuplicate(win, dayId, detected.sourceUrl, foreground)
    }
    if (!foreground) showDuplicateOverlay(detected.sourceUrl)
    return 'duplicate'
  }

  lastDuplicateUrl = ''

  const item = createItemRecord({
    dayId,
    type: 'link',
    sourceUrl: detected.sourceUrl,
    content: null
  })

  if (win) {
    notifyCapture(win, {
      id: item.id,
      dayId: item.dayId,
      sourceUrl: detected.sourceUrl,
      showInAppToast: foreground
    })
  }

  if (!foreground) {
    showCaptureOverlay({
      id: item.id,
      dayId: item.dayId,
      sourceUrl: detected.sourceUrl
    })
  }

  return 'captured'
}

function tryCapture(getWindow: () => BrowserWindow | null): void {
  if (Date.now() < ignoreOwnWritesUntil) return

  const text = clipboard.readText().trim()
  if (!text || text === lastClipboardText) return
  lastClipboardText = text

  const detected = detectUrl(text)
  if (!detected) return
  if (isSuppressed(detected.sourceUrl)) return

  captureUrlToToday(detected, getWindow)
}

export function registerClipboardWatcher(getWindow: () => BrowserWindow | null): void {
  if (pollTimer) return

  lastClipboardText = clipboard.readText().trim()

  registerCaptureToast({
    getMainWindow: getWindow,
    suppressUrl: suppressClipboardUrl
  })

  ipcMain.handle('clipboard:suppress', (_e, url: string) => {
    suppressClipboardUrl(url)
  })

  pollTimer = setInterval(() => {
    pruneSuppressed()
    tryCapture(getWindow)
  }, POLL_MS)
}

export function unregisterClipboardWatcher(): void {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  ipcMain.removeHandler('clipboard:suppress')
}
