import type { BrowserWindow } from 'electron'
import { registerExportHandlers } from './export'
import { registerSettingsHandlers } from './settings'
import { registerUpdaterHandlers } from './updater'

export function registerAllHandlers(getWindow: () => BrowserWindow | null): void {
  registerExportHandlers()
  registerSettingsHandlers()
  registerUpdaterHandlers(getWindow)
}
