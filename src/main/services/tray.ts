import { readFileSync } from 'node:fs'
import { app, type BrowserWindow, Menu, nativeImage, Tray } from 'electron'
import trayIcon1x from '../../../resources/trayTemplate.png?asset'
import trayIcon2x from '../../../resources/hannah.h@example.com?asset'

// Menu-bar / system-tray presence so the app stays reachable while its window
// is hidden. Left-click toggles the window; the context menu offers Open/Quit.

let tray: Tray | null = null

function trayTemplateImage(): Electron.NativeImage {
  // Provide 16pt + @2x bitmaps directly — resizing a single asset to 18px
  // was soft/blurry in the menu bar.
  const image = nativeImage.createEmpty()
  image.addRepresentation({
    scaleFactor: 1.0,
    width: 16,
    height: 16,
    buffer: readFileSync(trayIcon1x)
  })
  image.addRepresentation({
    scaleFactor: 2.0,
    width: 32,
    height: 32,
    buffer: readFileSync(trayIcon2x)
  })
  // Template image = macOS renders it as a monochrome mask that adapts to the
  // light/dark menu bar. Ignored on Windows/Linux, so it's safe everywhere.
  image.setTemplateImage(true)
  return image
}

export function createTray(getWindow: () => BrowserWindow | null): void {
  if (tray) return

  tray = new Tray(trayTemplateImage())
  tray.setToolTip('Sediment — copied links save automatically')

  function showWindow(): void {
    const w = getWindow()
    if (!w) return
    w.show()
    w.focus()
  }

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open Sediment', click: showWindow },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ])
  )

  tray.on('click', () => {
    const w = getWindow()
    if (!w) return
    if (w.isVisible() && !w.isMinimized()) w.hide()
    else showWindow()
  })
}

export function destroyTray(): void {
  tray?.destroy()
  tray = null
}
