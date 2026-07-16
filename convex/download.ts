import { v } from 'convex/values'
import { internalMutation } from './_generated/server'

export const recordSignup = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.trim().toLowerCase()
    const existing = await ctx.db
      .query('downloadSignups')
      .withIndex('by_email', (q) => q.eq('email', normalized))
      .unique()

    if (existing) return existing._id

    return await ctx.db.insert('downloadSignups', {
      email: normalized
    })
  }
})
