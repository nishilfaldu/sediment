import { create } from 'zustand'

interface SelectionStore {
  ids: string[]
  toggle: (id: string) => void
  clear: () => void
}

export const useSelection = create<SelectionStore>((set) => ({
  ids: [],

  toggle(id) {
    set((state) => {
      if (state.ids.includes(id)) {
        return { ids: state.ids.filter((x) => x !== id) }
      }
      return { ids: [...state.ids, id] }
    })
  },

  clear() {
    set({ ids: [] })
  }
}))
