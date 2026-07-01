import { asc, desc, eq } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { nanoid } from 'nanoid'
import { ensureDay } from '../db/ensure-day'
import { getDb } from '../db'
import { items, type NewItem } from '../db/schema'
import { saveImageDataUrl } from '../services/image-store'
import { fetchOgMetadata } from '../services/og-fetcher'
import { needsOgFetch } from '../services/item-metadata'

type CreateItemInput = Omit<NewItem, 'id' | 'createdAt' | 'updatedAt'>

export function registerItemsHandlers(): void {
  ipcMain.handle('items:getByDay', (_e, dayId: string) => {
    const db = getDb()
    return db.select().from(items).where(eq(items.dayId, dayId)).orderBy(asc(items.createdAt)).all()
  })

  // Insert a new item. Ensures the day row exists (FK) in the same flow.
  ipcMain.handle('items:create', (_e, payload: CreateItemInput) => {
    ensureDay(payload.dayId)

    const db = getDb()
    const now = Date.now()
    const id = nanoid()

    const existing = db
      .select({ position: items.position })
      .from(items)
      .where(eq(items.dayId, payload.dayId))
      .orderBy(asc(items.position))
      .all()

    const nextPosition = existing.length > 0 ? existing[existing.length - 1].position + 1 : 0

    let content = payload.content ?? null
    let imagePath: string | null = null

    if (payload.type === 'image' && typeof content === 'string' && content.startsWith('data:')) {
      try {
        imagePath = saveImageDataUrl(id, content)
        content = null
      } catch {
        // If the save fails keep the data URL in content as a fallback
      }
    }

    const item = db
      .insert(items)
      .values({
        ...payload,
        id,
        content,
        imagePath,
        position: nextPosition,
        createdAt: now,
        updatedAt: now
      })
      .returning()
      .get()

    if (needsOgFetch(item)) {
      fetchOgMetadata(item.id, item.dayId, item.sourceUrl as string)
    }

    return item
  })

  ipcMain.handle('items:update', (_e, id: string, patch: Partial<CreateItemInput>) => {
    const db = getDb()

    const item = db
      .update(items)
      .set({ ...patch, updatedAt: Date.now() })
      .where(eq(items.id, id))
      .returning()
      .get()

    if (needsOgFetch(item, { requireNoTitle: true })) {
      fetchOgMetadata(item.id, item.dayId, item.sourceUrl as string)
    }

    return item
  })

  ipcMain.handle('items:delete', (_e, id: string) => {
    const db = getDb()
    db.delete(items).where(eq(items.id, id)).run()
  })

  ipcMain.handle('items:move', (_e, id: string, x: number, y: number) => {
    const db = getDb()
    return db
      .update(items)
      .set({ x, y, updatedAt: Date.now() })
      .where(eq(items.id, id))
      .returning()
      .get()
  })

  ipcMain.handle('items:bringToFront', (_e, id: string, dayId: string) => {
    const db = getDb()
    const top = db
      .select({ position: items.position })
      .from(items)
      .where(eq(items.dayId, dayId))
      .orderBy(desc(items.position))
      .limit(1)
      .get()
    const next = (top?.position ?? 0) + 1
    return db
      .update(items)
      .set({ position: next, updatedAt: Date.now() })
      .where(eq(items.id, id))
      .returning()
      .get()
  })
}
