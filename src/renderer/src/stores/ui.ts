import { create } from 'zustand'

export interface UIStore {
  historyOpen: boolean
  toggleHistory: () => void
  setHistoryOpen: (open: boolean) => void
}

export const useUI = create<UIStore>((set) => ({
  historyOpen: true,
  toggleHistory: () => set((s) => ({ historyOpen: !s.historyOpen })),
  setHistoryOpen: (open) => set({ historyOpen: open })
}))
