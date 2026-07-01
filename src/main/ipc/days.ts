import { count, desc, eq } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { getDb } from '../db'
import { days, items } from '../db/schema'

export function registerDaysHandlers(): void {
  ipcMain.handle('days:list', () => {
    const db = getDb()
    return db
      .select({
        id: days.id,
        note: days.note,
        createdAt: days.createdAt,
        updatedAt: days.updatedAt,
        itemCount: count(items.id)
      })
      .from(days)
      .leftJoin(items, eq(items.dayId, days.id))
      .groupBy(days.id)
      .orderBy(desc(days.id))
      .all()
  })

  ipcMain.handle('days:getOrCreate', (_e, dayId: string) => {
    const db = getDb()
    const now = Date.now()

    const existing = db.select().from(days).where(eq(days.id, dayId)).get()
    if (existing) return existing

    return db.insert(days).values({ id: dayId, createdAt: now, updatedAt: now }).returning().get()
  })
}
