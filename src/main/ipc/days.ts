import { eq } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { getDb } from '../db'
import { days } from '../db/schema'

export function registerDaysHandlers(): void {
  // Returns all days that have items, sorted newest first.
  // Used to populate the sidebar calendar.
  ipcMain.handle('days:list', () => {
    const db = getDb()
    return db.select().from(days).orderBy(days.id).all().reverse()
  })

  // Upsert a day row and return it. Called before inserting the first item
  // of a given day so the foreign key is satisfied.
  ipcMain.handle('days:getOrCreate', (_e, dayId: string) => {
    const db = getDb()
    const now = Date.now()

    const existing = db.select().from(days).where(eq(days.id, dayId)).get()
    if (existing) return existing

    return db.insert(days).values({ id: dayId, createdAt: now, updatedAt: now }).returning().get()
  })
}
