import { create } from 'zustand'
import { todayId } from '@/lib/dates'

export interface CurrentDayStore {
  dayId: string
  // Set when navigating to a specific item (e.g. from search) so the board can
  // scroll it into view and flash it. Cleared by the item once it has reacted.
  focusItemId: string | null
  setDayId: (id: string) => void
  goToToday: () => void
  goToItem: (dayId: string, itemId: string) => void
  clearFocus: () => void
}

export const useCurrentDay = create<CurrentDayStore>((set) => ({
  dayId: todayId(),
  focusItemId: null,
  setDayId: (id) => set({ dayId: id, focusItemId: null }),
  goToToday: () => set({ dayId: todayId(), focusItemId: null }),
  goToItem: (dayId, itemId) => set({ dayId, focusItemId: itemId }),
  clearFocus: () => set({ focusItemId: null })
}))
