import { create } from 'zustand'

const RECENT_MS = 800

export interface RecentItemsStore {
  expiresAt: Record<string, number>
  markRecent: (id: string) => void
  prune: () => void
}

export const useRecentItems = create<RecentItemsStore>((set, get) => ({
  expiresAt: {},

  markRecent(id: string) {
    const until = Date.now() + RECENT_MS
    set((state) => ({
      expiresAt: { ...state.expiresAt, [id]: until }
    }))
    setTimeout(() => get().prune(), RECENT_MS)
  },

  prune() {
    const now = Date.now()
    set((state) => {
      const next: Record<string, number> = {}
      for (const [id, until] of Object.entries(state.expiresAt)) {
        if (until > now) next[id] = until
      }
      if (Object.keys(next).length === Object.keys(state.expiresAt).length) {
        return state
      }
      return { expiresAt: next }
    })
  }
}))

export function isRecentItem(expiresAt: Record<string, number>, id: string): boolean {
  const until = expiresAt[id]
  return until !== undefined && until > Date.now()
}
