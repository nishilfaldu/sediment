import { create } from 'zustand'

export type WorkspaceTab = 'links' | 'notes'

export interface WorkspaceTabStore {
  tabByDay: Record<string, WorkspaceTab>
  getTab: (dayId: string) => WorkspaceTab
  setTab: (dayId: string, tab: WorkspaceTab) => void
}

export const useWorkspaceTab = create<WorkspaceTabStore>((set, get) => ({
  tabByDay: {},
  getTab: (dayId) => get().tabByDay[dayId] ?? 'links',
  setTab: (dayId, tab) =>
    set((state) => ({
      tabByDay: { ...state.tabByDay, [dayId]: tab }
    }))
}))
