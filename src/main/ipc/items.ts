import { asc, desc, eq } from 'drizzle-orm'
import { ipcMain } from 'electron'
import { nanoid } from 'nanoid'
import { getDb } from '../db'
import { items, type NewItem } from '../db/schema'
import { saveImageDataUrl } from '../services/image-store'
import { fetchOgMetadata } from '../services/og-fetcher'

// Payload the renderer sends when creating an item.
// Derived from Drizzle's inferred insert type so it stays in sync with the
// schema automatically — no manual interface to maintain.
type CreateItemInput = Omit<NewItem, 'id' | 'createdAt' | 'updatedAt'>

export function registerItemsHandlers(): void {
  // Fetch all items for a given day, ordered by creation time. `position` is the
  // visual stacking order (bumped by bringToFront) so it can't double as a stable
  // list order — ordering by createdAt keeps render/export order fixed.
  ipcMain.handle('items:getByDay', (_e, dayId: string) => {
    const db = getDb()
    return db.select().from(items).where(eq(items.dayId, dayId)).orderBy(asc(items.createdAt)).all()
  })

  // Insert a new item. The day row must already exist (call days:getOrCreate first).
  // Position is set to max(existing positions) + 1 so the new item appends to the end.
  ipcMain.handle('items:create', (_e, payload: CreateItemInput) => {
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

    // Image items arrive with a base64 data URL in content.  Save it to disk
    // and store a sediment:// URL in imagePath instead so the DB stays lean.
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

    // Kick off OG metadata fetch asynchronously — the item is already saved and
    // returned to the renderer.  When the fetch completes it patches the row and
    // pushes item:metadataUpdated so the renderer re-renders the card.
    if (
      item.sourceUrl &&
      (item.type === 'link' || item.type === 'video' || item.type === 'social')
    ) {
      fetchOgMetadata(item.id, item.dayId, item.sourceUrl)
    }

    return item
  })

  // Patch any field(s) on an existing item.
  // Type upgrades (text → link/video/social) are initiated by the renderer via
  // the "Paste as" menu; the patch already contains the correct type + sourceUrl.
  ipcMain.handle('items:update', (_e, id: string, patch: Partial<CreateItemInput>) => {
    const db = getDb()

    const item = db
      .update(items)
      .set({ ...patch, updatedAt: Date.now() })
      .where(eq(items.id, id))
      .returning()
      .get()

    // Only fetch metadata when upgrading a fresh item (no title yet).
    // Guarding on !item.title prevents re-fetching on every subsequent update
    // to an item that already has OG data.
    if (
      item.sourceUrl &&
      !item.title &&
      (item.type === 'link' || item.type === 'video' || item.type === 'social')
    ) {
      fetchOgMetadata(item.id, item.dayId, item.sourceUrl)
    }

    return item
  })

  // Patch OG/embed metadata after async fetch completes.
  // Called from ogFetcher once the network request resolves.
  ipcMain.handle(
    'items:updateMetadata',
    (_e, id: string, meta: Pick<NewItem, 'title' | 'description' | 'thumbnail' | 'metadata'>) => {
      const db = getDb()
      return db
        .update(items)
        .set({ ...meta, updatedAt: Date.now() })
        .where(eq(items.id, id))
        .returning()
        .get()
    }
  )

  // Delete an item by id.
  ipcMain.handle('items:delete', (_e, id: string) => {
    const db = getDb()
    db.delete(items).where(eq(items.id, id)).run()
  })

  // Update the canvas position of a single item after a drag.
  ipcMain.handle('items:move', (_e, id: string, x: number, y: number) => {
    const db = getDb()
    return db
      .update(items)
      .set({ x, y, updatedAt: Date.now() })
      .where(eq(items.id, id))
      .returning()
      .get()
  })

  // Raise an item above all others on its day. `position` doubles as the
  // stacking order (rendered as z-index), so bumping it past the current max
  // brings the item to the front.
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
