import type { BrowserWindow } from 'electron'
import { clipboard, globalShortcut } from 'electron'
import { detectContent } from './content-detector'

/*
 * The payload shape sent over IPC to the renderer on each shortcut trigger.
 * Mirrors what the renderer's ClipboardPayload type expects.
 */
export interface ShortcutPayload {
  type: 'text' | 'link' | 'video' | 'social' | 'image'
  content?: string
  sourceUrl?: string
  platform?: string
  // base64 data URL — only set for type='image'.
  // Phase 4 will save this to userData/images/ and replace with a local path.
  dataUrl?: string
}

export function registerGlobalShortcut(mainWindow: BrowserWindow): void {
  // CommandOrControl maps to Cmd on macOS and Ctrl on Windows/Linux.
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    const image = clipboard.readImage()

    let payload: ShortcutPayload

    if (!image.isEmpty()) {
      // Clipboard holds a raster image (screenshot, copied photo, etc.)
      payload = { type: 'image', dataUrl: image.toDataURL() }
    } else {
      const text = clipboard.readText().trim()
      // Nothing in the clipboard — silently ignore rather than creating an empty item
      if (!text) return

      const detected = detectContent(text)
      payload = {
        type: detected.type,
        content: detected.content,
        sourceUrl: detected.sourceUrl,
        platform: detected.platform
      }
    }

    // Bring window to front so the user sees the capture immediately
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()

    mainWindow.webContents.send('shortcut:triggered', payload)
  })
}

// Called on app 'will-quit' to clean up the OS-level shortcut registration
export function unregisterGlobalShortcut(): void {
  globalShortcut.unregisterAll()
}
