import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'

/** Upsert digest and bump itemCount by 1. */
export async function incrementDayDigest(
  ctx: MutationCtx,
  userId: Id<'users'>,
  dayId: string
): Promise<void> {
  const existing = await ctx.db
    .query('dayDigests')
    .withIndex('by_user_day', (q) => q.eq('userId', userId).eq('dayId', dayId))
    .unique()

  if (existing) {
    await ctx.db.patch(existing._id, { itemCount: existing.itemCount + 1 })
    return
  }
  await ctx.db.insert('dayDigests', { userId, dayId, itemCount: 1 })
}

/** Decrement itemCount; delete the digest row when it hits zero. */
export async function decrementDayDigest(
  ctx: MutationCtx,
  userId: Id<'users'>,
  dayId: string
): Promise<void> {
  const existing = await ctx.db
    .query('dayDigests')
    .withIndex('by_user_day', (q) => q.eq('userId', userId).eq('dayId', dayId))
    .unique()

  if (!existing) return

  if (existing.itemCount <= 1) {
    await ctx.db.delete(existing._id)
    return
  }
  await ctx.db.patch(existing._id, { itemCount: existing.itemCount - 1 })
}

/** Move an item between days in the digest counts. */
export async function moveDayDigest(
  ctx: MutationCtx,
  userId: Id<'users'>,
  fromDayId: string,
  toDayId: string
): Promise<void> {
  if (fromDayId === toDayId) return
  await decrementDayDigest(ctx, userId, fromDayId)
  await incrementDayDigest(ctx, userId, toDayId)
}
