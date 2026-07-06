import type { JSX } from 'react'
import { DayBoard } from '@/components/board/day-board'
import { BottomBar } from '@/components/layout/bottom-bar'
import { HistoryPanel } from '@/components/layout/history-panel'
import { useCurrentDay } from '@/stores/current-day'

export function AppShell(): JSX.Element {
  const { dayId } = useCurrentDay()

  return (
    <div className="flex h-screen w-screen flex-col bg-white">
      <div
        className="h-3 w-full shrink-0 select-none"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <DayBoard key={dayId} dayId={dayId} />
        </main>

        <HistoryPanel />
      </div>

      <BottomBar />
    </div>
  )
}
