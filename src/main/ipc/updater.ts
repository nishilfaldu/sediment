import { ipcMain, type BrowserWindow } from 'electron'
import {
  checkForUpdates,
  downloadAndInstallUpdate,
  getUpdaterStatus,
  onUpdaterStatus
} from '../services/updater'

export function registerUpdaterHandlers(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle('updater:getStatus', () => getUpdaterStatus())
  ipcMain.handle('updater:check', () => checkForUpdates())
  ipcMain.handle('updater:install', () => downloadAndInstallUpdate())

  // Push status changes to the focused / main window.
  onUpdaterStatus((status) => {
    const win = getWindow()
    win?.webContents.send('updater:status', status)
  })
}
