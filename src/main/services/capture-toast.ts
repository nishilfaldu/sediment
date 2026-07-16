import { join } from 'node:path'
import type { CaptureToastShow } from '@shared/clipboard-capture'
import { BRIEF_TOAST_MS, CAPTURE_TOAST_MS, linkCapturePreview } from '@shared/toast'
import { BrowserWindow, ipcMain, screen } from 'electron'

const isDev = process.env.NODE_ENV === 'development'
const TOAST_WIDTH = 420
const TOAST_HEIGHT = 84
const TOAST_BOTTOM_GAP = 28

type PendingUndo = {
  id: string
  dayId: string
  sourceUrl: string
}

type CaptureToastDeps = {
  getMainWindow: () => BrowserWindow | null
  suppressUrl: (url: string) => void
}

let toastWindow: BrowserWindow | null = null
let dismissTimer: ReturnType<typeof setTimeout> | null = null
let pendingUndo: PendingUndo | null = null
let deps: CaptureToastDeps | null = null
let handlersRegistered = false
let toastReady = false
let queuedShow: CaptureToastShow | null = null

function clearDismissTimer(): void {
  if (dismissTimer) {
    clearTimeout(dismissTimer)
    dismissTimer = null
  }
}

function positionToast(win: BrowserWindow): void {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const { x, y, width, height } = display.workArea
  win.setBounds({
    x: Math.round(x + (width - TOAST_WIDTH) / 2),
    y: Math.round(y + height - TOAST_HEIGHT - TOAST_BOTTOM_GAP),
    width: TOAST_WIDTH,
    height: TOAST_HEIGHT
  })
}

function deliverShow(win: BrowserWindow, payload: CaptureToastShow): void {
  win.webContents.send('capture-toast:show', payload)
  win.showInactive()
  scheduleDismiss(payload.durationMs)
}

function ensureToastWindow(): BrowserWindow {
  if (toastWindow && !toastWindow.isDestroyed()) return toastWindow

  toastReady = false
  queuedShow = null

  const win = new BrowserWindow({
    width: TOAST_WIDTH,
    height: TOAST_HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  win.setAlwaysOnTop(true, 'floating')

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/toast.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/toast.html'))
  }

  win.on('closed', () => {
    toastWindow = null
    toastReady = false
    queuedShow = null
  })

  toastWindow = win
  return win
}

function hideToast(): void {
  clearDismissTimer()
  pendingUndo = null
  queuedShow = null
  if (toastWindow && !toastWindow.isDestroyed()) {
    toastWindow.hide()
  }
}

function scheduleDismiss(durationMs: number): void {
  clearDismissTimer()
  dismissTimer = setTimeout(() => {
    hideToast()
  }, durationMs)
}

function showOnWindow(win: BrowserWindow, payload: CaptureToastShow): void {
  positionToast(win)
  if (!toastReady) {
    queuedShow = payload
    return
  }
  deliverShow(win, payload)
}

export function showCaptureOverlay(opts: { id: string; dayId: string; sourceUrl: string }): void {
  pendingUndo = { id: opts.id, dayId: opts.dayId, sourceUrl: opts.sourceUrl }
  const preview = linkCapturePreview(opts.sourceUrl)
  const win = ensureToastWindow()
  showOnWindow(win, {
    message: 'Saved',
    tagLabel: preview.tagLabel,
    detail: preview.detail,
    thumbnailUrl: preview.thumbnailUrl,
    canUndo: true,
    durationMs: CAPTURE_TOAST_MS
  })
}

export function showDuplicateOverlay(sourceUrl: string): void {
  pendingUndo = null
  const preview = linkCapturePreview(sourceUrl)
  const win = ensureToastWindow()
  showOnWindow(win, {
    message: 'Already saved',
    tagLabel: preview.tagLabel,
    detail: preview.detail,
    thumbnailUrl: preview.thumbnailUrl,
    canUndo: false,
    durationMs: BRIEF_TOAST_MS
  })
}

export function registerCaptureToast(nextDeps: CaptureToastDeps): void {
  deps = nextDeps
  if (handlersRegistered) return
  handlersRegistered = true

  ipcMain.handle('capture-toast:undo', () => {
    const pending = pendingUndo
    const suppress = deps?.suppressUrl
    hideToast()
    if (!pending || !suppress) return

    suppress(pending.sourceUrl)
    const main = deps?.getMainWindow()
    if (main && !main.isDestroyed()) {
      main.webContents.send('clipboard:undo-request', pending)
    }
  })

  ipcMain.handle('capture-toast:dismiss', () => {
    hideToast()
  })

  ipcMain.handle('capture-toast:ready', (event) => {
    if (!toastWindow || event.sender !== toastWindow.webContents) return
    toastReady = true
    const queued = queuedShow
    queuedShow = null
    if (queued) deliverShow(toastWindow, queued)
  })

  ipcMain.handle(
    'capture-toast:showOverlay',
    (_e, payload: { id: string; dayId: string; sourceUrl: string }) => {
      showCaptureOverlay(payload)
    }
  )

  ipcMain.handle('capture-toast:showDuplicateOverlay', (_e, sourceUrl: string) => {
    showDuplicateOverlay(sourceUrl)
  })
}

export function closeCaptureToastWindow(): void {
  clearDismissTimer()
  pendingUndo = null
  queuedShow = null
  toastReady = false
  if (toastWindow && !toastWindow.isDestroyed()) {
    toastWindow.destroy()
  }
  toastWindow = null
}

export function destroyCaptureToast(): void {
  closeCaptureToastWindow()
  if (handlersRegistered) {
    ipcMain.removeHandler('capture-toast:undo')
    ipcMain.removeHandler('capture-toast:dismiss')
    ipcMain.removeHandler('capture-toast:ready')
    ipcMain.removeHandler('capture-toast:showOverlay')
    ipcMain.removeHandler('capture-toast:showDuplicateOverlay')
    handlersRegistered = false
  }
  deps = null
}
