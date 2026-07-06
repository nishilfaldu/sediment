import { eq } from 'drizzle-orm'
import { getDb } from './index'
import { days } from './schema'

// Upsert a day row so item inserts satisfy the foreign key.
export function ensureDay(dayId: string): void {
  const db = getDb()
  const existing = db.select().from(days).where(eq(days.id, dayId)).get()
  if (existing) return

  db.insert(days).values({ id: dayId }).run()
}
