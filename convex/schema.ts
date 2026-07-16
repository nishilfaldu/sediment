import { authTables } from '@convex-dev/auth/server'
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  ...authTables,

  // Marketing-site download gate (email before Mac DMG).
  downloadSignups: defineTable({
    email: v.string()
  }).index('by_email', ['email']),

  // Compact per-day counts for the history sidebar (paginated; not derived via .collect()).
  dayDigests: defineTable({
    userId: v.id('users'),
    dayId: v.string(),
    itemCount: v.number()
  }).index('by_user_day', ['userId', 'dayId']),

  // dayId is an ISO local date string on each item ("2026-05-26").
  items: defineTable({
    userId: v.id('users'),
    dayId: v.string(),
    type: v.union(v.literal('text'), v.literal('link')),
    content: v.union(v.string(), v.null()),
    sourceUrl: v.union(v.string(), v.null()),
    title: v.union(v.string(), v.null()),
    description: v.union(v.string(), v.null()),
    thumbnail: v.union(v.string(), v.null()),
    searchText: v.string(),
    updatedAt: v.number()
  })
    .index('by_user', ['userId'])
    .index('by_user_day', ['userId', 'dayId'])
    .index('by_user_day_url', ['userId', 'dayId', 'sourceUrl'])
    .searchIndex('search_items', {
      searchField: 'searchText',
      filterFields: ['userId']
    })
})
