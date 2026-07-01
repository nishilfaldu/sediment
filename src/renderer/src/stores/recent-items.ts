import { create } from 'zustand'

const RECENT_MS = 800

export interface RecentItemsStore {
  recentIds: Set<string>
  markRecent: (id: string) => void
  isRecent: (id: string) => boolean
}

export const useRecentItems = create<RecentItemsStore>((set, get) => ({
  recentIds: new Set(),

  markRecent(id: string) {
    set((state) => {
      const next = new Set(state.recentIds)
      next.add(id)
      return { recentIds: next }
    })
    setTimeout(() => {
      set((state) => {
        const next = new Set(state.recentIds)
        next.delete(id)
        return { recentIds: next }
      })
    }, RECENT_MS)
  },

  isRecent(id: string) {
    return get().recentIds.has(id)
  }
}))
