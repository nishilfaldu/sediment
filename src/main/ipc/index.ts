import { registerDaysHandlers } from './days'
import { registerExportHandlers } from './export'
import { registerItemsHandlers } from './items'
import { registerMetadataHandlers } from './metadata'
import { registerSearchHandlers } from './search'

// Call once in app.whenReady() after initDb().
export function registerAllHandlers(): void {
  registerDaysHandlers()
  registerItemsHandlers()
  registerMetadataHandlers()
  registerSearchHandlers()
  registerExportHandlers()
}
