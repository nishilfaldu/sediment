import { ITEM_TYPES, type ItemType } from '@shared/types'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export { ITEM_TYPES, type ItemType }

// One row per calendar day that has at least one item.
// id is an ISO date string: "2026-05-26" (local calendar date, not UTC)
export const days = sqliteTable('days', {
  id: text('id').primaryKey()
})

export const items = sqliteTable('items', {
  id: text('id').primaryKey(),
  dayId: text('day_id')
    .notNull()
    .references(() => days.id),
  type: text('type').$type<ItemType>().notNull(),
  content: text('content'),
  sourceUrl: text('source_url'),
  title: text('title'),
  description: text('description'),
  thumbnail: text('thumbnail'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert
export type Day = typeof days.$inferSelect
export type NewDay = typeof days.$inferInsert
