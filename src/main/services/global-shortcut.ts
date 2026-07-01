import type { ShortcutPayload } from '@shared/shortcut'
import { detectContent } from '@shared/detect-url'
import type { BrowserWindow } from 'electron'
import { clipboard, globalShortcut } from 'electron'

export type { ShortcutPayload }

export function registerGlobalShortcut(mainWindow: BrowserWindow): void {
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    const image = clipboard.readImage()

    let payload: ShortcutPayload

    if (!image.isEmpty()) {
      payload = { type: 'image', dataUrl: image.toDataURL() }
    } else {
      const text = clipboard.readText().trim()
      if (!text) return

      const detected = detectContent(text)
      payload = {
        type: detected.type,
        content: detected.content,
        sourceUrl: detected.sourceUrl,
        platform: detected.platform
      }
    }

    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()

    mainWindow.webContents.send('shortcut:triggered', payload)
  })
}

export function unregisterGlobalShortcut(): void {
  globalShortcut.unregisterAll()
}
