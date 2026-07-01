import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { ITEM_TYPES, PLATFORMS, WIDTH_HINTS, type ItemType, type Platform, type WidthHint } from '@shared/types'

export { ITEM_TYPES, PLATFORMS, WIDTH_HINTS, type ItemType, type Platform, type WidthHint }

// One row per calendar day that has at least one item.
// id is an ISO date string: "2026-05-26" (local calendar date, not UTC)
export const days = sqliteTable('days', {
  id: text('id').primaryKey(),
  note: text('note'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
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
  imagePath: text('image_path'),
  platform: text('platform').$type<Platform | null>(),
  metadata: text('metadata'),
  x: integer('x').notNull().default(40),
  y: integer('y').notNull().default(40),
  // Stacking order rendered as z-index on the freeform canvas.
  position: integer('position').notNull().default(0),
  // Reserved for future layout hints — not used by the freeform canvas yet.
  widthHint: text('width_hint').$type<WidthHint>().notNull().default('medium'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert
export type Day = typeof days.$inferSelect
export type NewDay = typeof days.$inferInsert
