import { getAuthUserId } from '@convex-dev/auth/server'
import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import { internalMutation, mutation, query } from './_generated/server'
import { requireUserId } from './lib/auth'
import { incrementDayDigest } from './lib/dayDigests'

const BACKFILL_BATCH = 200

/** Paginated history sidebar — newest dayId first. */
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return {
        page: [] as { id: string; itemCount: number }[],
        isDone: true,
        continueCursor: ''
      }
    }

    const result = await ctx.db
      .query('dayDigests')
      .withIndex('by_user_day', (q) => q.eq('userId', userId))
      .order('desc')
      .paginate(paginationOpts)

    return {
      ...result,
      page: result.page.map((row) => ({
        id: row.dayId,
        itemCount: row.itemCount
      }))
    }
  }
})

/** Kick off wipe + rebuild of digests from items (authenticated). */
export const startBackfill = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx)
    await ctx.scheduler.runAfter(0, internal.days.clearDigestsBatch, {
      cursor: null
    })
  }
})

/** Internal entry: `bunx convex run days:backfill` */
export const backfill = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.days.clearDigestsBatch, {
      cursor: null
    })
  }
})

export const clearDigestsBatch = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db.query('dayDigests').paginate({
      cursor,
      numItems: BACKFILL_BATCH
    })

    for (const row of page.page) {
      await ctx.db.delete(row._id)
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.days.clearDigestsBatch, {
        cursor: page.continueCursor
      })
      return
    }

    await ctx.scheduler.runAfter(0, internal.days.rebuildDigestsBatch, {
      cursor: null
    })
  }
})

export const rebuildDigestsBatch = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db.query('items').paginate({
      cursor,
      numItems: BACKFILL_BATCH
    })

    for (const item of page.page) {
      await incrementDayDigest(ctx, item.userId, item.dayId)
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.days.rebuildDigestsBatch, {
        cursor: page.continueCursor
      })
    }
  }
})
