import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import { query } from './_generated/server'

export const queryItems = query({
  args: { query: v.string() },
  handler: async (ctx, { query: searchQuery }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const trimmed = searchQuery.trim()
    if (!trimmed) return []

    return await ctx.db
      .query('items')
      .withSearchIndex('search_items', (q) => q.search('searchText', trimmed).eq('userId', userId))
      .take(50)
  }
})
