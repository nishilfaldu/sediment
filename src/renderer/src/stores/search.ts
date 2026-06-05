import { create } from 'zustand'

// Open/close state for the Cmd+K full-text search modal.
export interface SearchStore {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const useSearch = create<SearchStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open }))
}))
