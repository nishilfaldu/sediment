import { asc, eq } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { getDb } from '../db'
import { items } from '../db/schema'
import { type CreateItemInput, createItemRecord } from '../services/create-item'
import { deleteItemRecord } from '../services/delete-item'
import { fetchOgIfAwaiting } from '../services/item-metadata'
import { fetchOgMetadata } from '../services/og-fetcher'

export function registerItemsHandlers(): void {
  ipcMain.handle('items:getByDay', (_e, dayId: string) => {
    const db = getDb()
    return db.select().from(items).where(eq(items.dayId, dayId)).orderBy(asc(items.createdAt)).all()
  })

  ipcMain.handle('items:create', (_e, payload: CreateItemInput) => createItemRecord(payload))

  ipcMain.handle('items:update', (_e, id: string, patch: Partial<CreateItemInput>) => {
    const db = getDb()

    const item = db
      .update(items)
      .set({ ...patch, updatedAt: Date.now() })
      .where(eq(items.id, id))
      .returning()
      .get()

    fetchOgIfAwaiting(item, fetchOgMetadata, { id: item.id, dayId: item.dayId })

    return item
  })

  ipcMain.handle('items:delete', (_e, id: string) => {
    deleteItemRecord(id)
  })
}
