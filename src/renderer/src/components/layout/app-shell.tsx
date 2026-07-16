import type { JSX } from 'react'
import { DayBoard } from '@/components/board/day-board'
import { BottomBar } from '@/components/layout/bottom-bar'
import { HistoryPanel } from '@/components/layout/history-panel'
import { SelectionBar } from '@/components/layout/selection-bar'
import { useCurrentDay } from '@/stores/current-day'

export function AppShell(): JSX.Element {
  const { dayId } = useCurrentDay()

  return (
    <div className="flex h-screen w-screen flex-col bg-surface">
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <DayBoard key={dayId} dayId={dayId} />
        </main>

        <HistoryPanel />
      </div>

      <SelectionBar />
      <BottomBar />
    </div>
  )
}
