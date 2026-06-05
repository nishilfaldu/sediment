import { create } from 'zustand'

// Tracks whether any canvas item is mid-drag. Read imperatively (getState) by
// metadata sync so it can defer query invalidations until the drag finishes —
// re-rendering a card mid-drag causes visible flicker/layout shift.
export interface DragStore {
  dragging: boolean
  setDragging: (dragging: boolean) => void
}

export const useDrag = create<DragStore>((set) => ({
  dragging: false,
  setDragging: (dragging) => set({ dragging })
}))
