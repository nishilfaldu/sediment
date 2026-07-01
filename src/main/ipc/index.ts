import { registerDaysHandlers } from './days'
import { registerExportHandlers } from './export'
import { registerItemsHandlers } from './items'
import { registerSearchHandlers } from './search'

// Call once in app.whenReady() after initDb().
export function registerAllHandlers(): void {
  registerDaysHandlers()
  registerItemsHandlers()
  registerSearchHandlers()
  registerExportHandlers()
}
