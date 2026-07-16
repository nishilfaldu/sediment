import { getAuthUserId } from '@convex-dev/auth/server'
import type { MutationCtx, QueryCtx } from '../_generated/server'

type AuthCtx = QueryCtx | MutationCtx

export async function requireUserId(ctx: AuthCtx) {
  const userId = await getAuthUserId(ctx)
  if (!userId) {
    throw new Error('Not authenticated')
  }
  return userId
}
