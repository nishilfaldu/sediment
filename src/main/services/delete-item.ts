import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { items } from '../db/schema'

/** Canonical item delete — both IPC and capture-toast undo must use this. */
export function deleteItemRecord(id: string): void {
  getDb().delete(items).where(eq(items.id, id)).run()
}
