import { create } from 'zustand'

export interface PasteModalTarget {
  dayId: string
  // When set, confirming upgrades this item instead of creating a new one.
  upgradeItemId?: string
}

export interface PasteModalStore {
  open: boolean
  url: string
  target: PasteModalTarget | null
  openWith: (url: string, target: PasteModalTarget) => void
  setUrl: (url: string) => void
  close: () => void
}

export const usePasteModal = create<PasteModalStore>((set) => ({
  open: false,
  url: '',
  target: null,
  openWith: (url, target) => set({ open: true, url, target }),
  setUrl: (url) => set({ url }),
  close: () => set({ open: false, url: '', target: null })
}))
