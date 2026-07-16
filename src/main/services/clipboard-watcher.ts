import type { ClipboardCandidatePayload } from '@shared/clipboard-capture'
import { todayId } from '@shared/dates'
import type { DetectedLink } from '@shared/detect-url'
import { detectUrl } from '@shared/detect-url'
import { type BrowserWindow, clipboard, ipcMain } from 'electron'
import { registerCaptureToast } from './capture-toast'
import { isMainWindowForeground } from './main-window'

const POLL_MS = 500
/** Brief pause after Undo so the URL still sitting on the clipboard is not immediately re-saved. */
const SUPPRESS_MS = 2_000
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

function notifyCandidate(win: BrowserWindow, payload: ClipboardCandidatePayload): void {
  win.webContents.send('clipboard:candidate', payload)
}

function offerUrlToToday(detected: DetectedLink, getWindow: () => BrowserWindow | null): void {
  const dayId = todayId()
  const win = getWindow()
  if (!win) return

  notifyCandidate(win, {
    dayId,
    sourceUrl: detected.sourceUrl,
    showInAppToast: isMainWindowForeground(win)
  })
}

function tryCapture(getWindow: () => BrowserWindow | null): void {
  if (Date.now() < ignoreOwnWritesUntil) return

  const text = clipboard.readText().trim()
  if (!text || text === lastClipboardText) return

  const detected = detectUrl(text)
  if (!detected) {
    lastClipboardText = text
    return
  }

  // While suppressed, do not advance lastClipboardText — otherwise a re-copy during
  // the suppress window is marked "seen" and never captured after suppress expires.
  if (isSuppressed(detected.sourceUrl)) return

  lastClipboardText = text
  offerUrlToToday(detected, getWindow)
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
