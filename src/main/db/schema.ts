import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Exhaustive lists kept as const arrays so the union types below are derived
// from a single source of truth — add a value here and types update everywhere.
export const ITEM_TYPES = ['text', 'image', 'link', 'video', 'social'] as const
export type ItemType = (typeof ITEM_TYPES)[number]

export const PLATFORMS = ['youtube', 'vimeo', 'twitter', 'instagram', 'bluesky'] as const
export type Platform = (typeof PLATFORMS)[number]

export const WIDTH_HINTS = ['small', 'medium', 'large'] as const
export type WidthHint = (typeof WIDTH_HINTS)[number]

// One row per calendar day that has at least one item.
// id is an ISO date string: "2026-05-26" (local calendar date, not UTC)
export const days = sqliteTable('days', {
  id: text('id').primaryKey(),
  note: text('note'),
  // UTC epoch milliseconds (Date.now()). Stored as a number — simpler than
  // ISO strings, no parsing needed, sorts correctly, and converting to the
  // user's local timezone for display is just new Date(ms).
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

// Every piece of content saved by the user.
export const items = sqliteTable('items', {
  id: text('id').primaryKey(), // nanoid
  dayId: text('day_id')
    .notNull()
    .references(() => days.id),

  // .$type<>() narrows the TypeScript type to the union — SQLite stores it as
  // plain text, but the compiler rejects values outside the defined set.
  type: text('type').$type<ItemType>().notNull(),

  // Plain text body (type='text'), or raw URL before OG fetch completes
  content: text('content'),
  sourceUrl: text('source_url'),
  title: text('title'),
  description: text('description'),
  // Remote URL or served local path (for images)
  thumbnail: text('thumbnail'),
  // Local path: userData/images/<id>.png — only set for type='image'
  imagePath: text('image_path'),

  platform: text('platform').$type<Platform | null>(),

  // JSON blob — arbitrary extra OG/embed data that varies per platform/type
  metadata: text('metadata'),

  // Canvas coordinates — absolute position on the day's freeform canvas
  x: integer('x').notNull().default(40),
  y: integer('y').notNull().default(40),

  // Legacy sort order (no longer used for display; kept to avoid migration churn)
  position: integer('position').notNull().default(0),

  // Masonry column span hint — drives how many columns the card occupies
  widthHint: text('width_hint').$type<WidthHint>().notNull().default('medium'),

  // UTC epoch milliseconds — see days.createdAt for rationale
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})

// Inferred insert/select types — use these everywhere instead of hand-writing
// interfaces. They stay in sync with the schema automatically.
export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert
export type Day = typeof days.$inferSelect
export type NewDay = typeof days.$inferInsert
