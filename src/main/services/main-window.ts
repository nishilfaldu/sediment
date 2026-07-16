import type { BrowserWindow } from 'electron'

export function isMainWindowForeground(win: BrowserWindow | null): boolean {
  if (!win || win.isDestroyed()) return false
  return win.isVisible() && !win.isMinimized() && win.isFocused()
}
