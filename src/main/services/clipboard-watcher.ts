import type { ClipboardCapturePayload } from '@shared/clipboard-capture'
import { todayId } from '@shared/dates'
import { detectUrl } from '@shared/detect-url'
import { type BrowserWindow, clipboard, ipcMain } from 'electron'
import { createItemRecord, hasSourceUrlOnDay } from './create-item'

const POLL_MS = 500
const SUPPRESS_MS = 30_000
const OWN_WRITE_MS = 1_500

let pollTimer: ReturnType<typeof setInterval> | null = null
let lastClipboardText = ''
let ignoreOwnWritesUntil = 0
const suppressedUrls = new Map<string, number>()

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

function tryCapture(getWindow: () => BrowserWindow | null): void {
  if (Date.now() < ignoreOwnWritesUntil) return

  const text = clipboard.readText().trim()
  if (!text || text === lastClipboardText) return
  lastClipboardText = text

  const detected = detectUrl(text)
  if (!detected) return
  if (isSuppressed(detected.sourceUrl)) return

  const dayId = todayId()
  if (hasSourceUrlOnDay(dayId, detected.sourceUrl)) return

  const item = createItemRecord({
    dayId,
    type: detected.type,
    sourceUrl: detected.sourceUrl,
    platform: detected.platform ?? null,
    content: null
  })

  const win = getWindow()
  if (!win) return

  notifyCapture(win, {
    id: item.id,
    dayId: item.dayId,
    type: detected.type,
    sourceUrl: detected.sourceUrl,
    platform: detected.platform
  })
}

export function registerClipboardWatcher(getWindow: () => BrowserWindow | null): void {
  if (pollTimer) return

  lastClipboardText = clipboard.readText().trim()

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
