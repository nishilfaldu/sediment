import { registerExportHandlers } from './export'
import { registerSettingsHandlers } from './settings'

export function registerAllHandlers(): void {
  registerExportHandlers()
  registerSettingsHandlers()
}
