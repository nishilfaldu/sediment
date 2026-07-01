import { app, type BrowserWindow, Menu, nativeImage, Tray } from 'electron'
import trayIconPath from '../../../resources/icon.png?asset'

// Menu-bar / system-tray presence so the app stays reachable while its window
// is hidden. Left-click toggles the window; the context menu offers Open/Quit.

let tray: Tray | null = null

export function createTray(getWindow: () => BrowserWindow | null): void {
  if (tray) return

  const image = nativeImage.createFromPath(trayIconPath).resize({ width: 18, height: 18 })
  // Template image = macOS renders it as a monochrome mask that adapts to the
  // light/dark menu bar. Ignored on Windows/Linux, so it's safe everywhere.
  image.setTemplateImage(true)

  tray = new Tray(image)
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
