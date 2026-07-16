import { type BrowserWindow, globalShortcut } from 'electron'
import { loadSettings, saveSettings } from './settings'

let getMainWindow: (() => BrowserWindow | null) | null = null
let activeHotkey: string | null = null

function showMainWindow(): void {
  const win = getMainWindow?.()
  if (!win || win.isDestroyed()) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}

function unregisterActive(): void {
  if (activeHotkey) {
    try {
      globalShortcut.unregister(activeHotkey)
    } catch {
      // ignore — shortcut may already be gone
    }
    activeHotkey = null
  }
}

/** Register (or clear) the global show-window hotkey. Returns an error message on failure. */
export function applyGlobalHotkey(accelerator: string | null): string | null {
  unregisterActive()

  if (!accelerator) {
    const settings = loadSettings()
    settings.globalHotkey = null
    saveSettings(settings)
    return null
  }

  const ok = globalShortcut.register(accelerator, showMainWindow)
  if (!ok) {
    return 'That shortcut is already in use by another app.'
  }

  activeHotkey = accelerator
  const settings = loadSettings()
  settings.globalHotkey = accelerator
  saveSettings(settings)
  return null
}

export function registerGlobalHotkey(getWindow: () => BrowserWindow | null): void {
  getMainWindow = getWindow
  const settings = loadSettings()
  if (settings.globalHotkey) {
    const ok = globalShortcut.register(settings.globalHotkey, showMainWindow)
    if (ok) {
      activeHotkey = settings.globalHotkey
    } else {
      console.warn('[hotkey] could not restore shortcut:', settings.globalHotkey)
    }
  }
}

export function unregisterGlobalHotkey(): void {
  unregisterActive()
  globalShortcut.unregisterAll()
  getMainWindow = null
}

export function getGlobalHotkey(): string | null {
  return loadSettings().globalHotkey
}
