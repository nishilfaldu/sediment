import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { internal } from './_generated/api'
import type { MutationCtx } from './_generated/server'
import { internalMutation, mutation, query } from './_generated/server'
import { requireUserId } from './lib/auth'
import {
  decrementDayDigest,
  incrementDayDigest,
  moveDayDigest
} from './lib/dayDigests'
import { buildSearchText } from './lib/itemHelpers'

type ItemFields = {
  dayId: string
  type: 'text' | 'link'
  content: string | null
  sourceUrl: string | null
  title: string | null
  description: string | null
  thumbnail: string | null
}

type ItemPatch = {
  dayId?: string
  type?: 'text' | 'link'
  content?: string | null
  sourceUrl?: string | null
  title?: string | null
  description?: string | null
  thumbnail?: string | null
}

async function insertItem(
  ctx: MutationCtx,
  userId: Id<'users'>,
  fields: ItemFields
) {
  const id = await ctx.db.insert('items', {
    userId,
    ...fields,
    searchText: buildSearchText(fields),
    updatedAt: Date.now()
  })

  await incrementDayDigest(ctx, userId, fields.dayId)

  if (fields.sourceUrl && !fields.title) {
    await ctx.scheduler.runAfter(0, internal.og.fetchAndPatch, {
      itemId: id,
      sourceUrl: fields.sourceUrl
    })
  }

  const doc = await ctx.db.get(id)
  if (!doc) throw new Error('Failed to create item')
  return doc
}

function mergeItemFields(existing: ItemFields, patch: ItemPatch): ItemFields {
  return {
    dayId: patch.dayId ?? existing.dayId,
    type: patch.type ?? existing.type,
    content: patch.content !== undefined ? patch.content : existing.content,
    sourceUrl: patch.sourceUrl !== undefined ? patch.sourceUrl : existing.sourceUrl,
    title: patch.title !== undefined ? patch.title : existing.title,
    description:
      patch.description !== undefined ? patch.description : existing.description,
    thumbnail: patch.thumbnail !== undefined ? patch.thumbnail : existing.thumbnail
  }
}

/** Refetch OG when the URL changes, or when title is explicitly cleared with nothing left. */
function wantsOgRefetch(patch: ItemPatch, next: ItemFields): boolean {
  if (!next.sourceUrl) return false
  if (patch.sourceUrl !== undefined) return true
  return patch.title === null && !next.title
}

export const getByDay = query({
  args: { dayId: v.string() },
  handler: async (ctx, { dayId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const rows = await ctx.db
      .query('items')
      .withIndex('by_user_day', (q) => q.eq('userId', userId).eq('dayId', dayId))
      .collect()

    return rows.sort((a, b) => a._creationTime - b._creationTime)
  }
})

export const getByIds = query({
  args: { ids: v.array(v.id('items')) },
  handler: async (ctx, { ids }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId || ids.length === 0) return []

    const order = new Map(ids.map((id, index) => [id, index]))
    const rows = await Promise.all(ids.map((id) => ctx.db.get(id)))
    return rows
      .filter((row): row is NonNullable<typeof row> => row !== null && row.userId === userId)
      .sort((a, b) => (order.get(a._id) ?? 0) - (order.get(b._id) ?? 0))
  }
})

export const create = mutation({
  args: {
    dayId: v.string(),
    type: v.union(v.literal('text'), v.literal('link')),
    content: v.optional(v.union(v.string(), v.null())),
    sourceUrl: v.optional(v.union(v.string(), v.null())),
    title: v.optional(v.union(v.string(), v.null())),
    description: v.optional(v.union(v.string(), v.null())),
    thumbnail: v.optional(v.union(v.string(), v.null()))
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    return insertItem(ctx, userId, {
      dayId: args.dayId,
      type: args.type,
      content: args.content ?? null,
      sourceUrl: args.sourceUrl ?? null,
      title: args.title ?? null,
      description: args.description ?? null,
      thumbnail: args.thumbnail ?? null
    })
  }
})

/** Atomic duplicate check + insert for clipboard capture. */
export const captureLink = mutation({
  args: {
    dayId: v.string(),
    sourceUrl: v.string()
  },
  handler: async (ctx, { dayId, sourceUrl }) => {
    const userId = await requireUserId(ctx)

    const existing = await ctx.db
      .query('items')
      .withIndex('by_user_day_url', (q) =>
        q.eq('userId', userId).eq('dayId', dayId).eq('sourceUrl', sourceUrl)
      )
      .first()

    if (existing) {
      return { status: 'duplicate' as const, item: existing }
    }

    const item = await insertItem(ctx, userId, {
      dayId,
      type: 'link',
      content: null,
      sourceUrl,
      title: null,
      description: null,
      thumbnail: null
    })
    return { status: 'created' as const, item }
  }
})

export const update = mutation({
  args: {
    id: v.id('items'),
    patch: v.object({
      dayId: v.optional(v.string()),
      type: v.optional(v.union(v.literal('text'), v.literal('link'))),
      content: v.optional(v.union(v.string(), v.null())),
      sourceUrl: v.optional(v.union(v.string(), v.null())),
      title: v.optional(v.union(v.string(), v.null())),
      description: v.optional(v.union(v.string(), v.null())),
      thumbnail: v.optional(v.union(v.string(), v.null()))
    })
  },
  handler: async (ctx, { id, patch }) => {
    const userId = await requireUserId(ctx)
    const existing = await ctx.db.get(id)
    if (!existing || existing.userId !== userId) {
      throw new Error('Item not found')
    }

    const next = mergeItemFields(existing, patch)

    await ctx.db.patch(id, {
      ...next,
      searchText: buildSearchText(next),
      updatedAt: Date.now()
    })

    if (next.dayId !== existing.dayId) {
      await moveDayDigest(ctx, userId, existing.dayId, next.dayId)
    }

    if (wantsOgRefetch(patch, next) && next.sourceUrl) {
      await ctx.scheduler.runAfter(0, internal.og.fetchAndPatch, {
        itemId: id,
        sourceUrl: next.sourceUrl
      })
    }

    const doc = await ctx.db.get(id)
    if (!doc) throw new Error('Item not found')
    return doc
  }
})

export const remove = mutation({
  args: { id: v.id('items') },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx)
    const existing = await ctx.db.get(id)
    if (!existing || existing.userId !== userId) {
      throw new Error('Item not found')
    }
    await ctx.db.delete(id)
    await decrementDayDigest(ctx, userId, existing.dayId)
  }
})

export const patchMetadata = internalMutation({
  args: {
    id: v.id('items'),
    title: v.union(v.string(), v.null()),
    description: v.union(v.string(), v.null()),
    thumbnail: v.union(v.string(), v.null())
  },
  handler: async (ctx, { id, title, description, thumbnail }) => {
    const existing = await ctx.db.get(id)
    if (!existing) return

    await ctx.db.patch(id, {
      title,
      description,
      thumbnail,
      searchText: buildSearchText({
        title,
        description,
        content: existing.content,
        sourceUrl: existing.sourceUrl
      }),
      updatedAt: Date.now()
    })
  }
})
