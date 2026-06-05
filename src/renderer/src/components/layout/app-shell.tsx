import type { JSX } from 'react'
import { DayBoard } from '@/components/board/day-board'
import { BottomBar } from '@/components/layout/bottom-bar'
import { HistoryPanel } from '@/components/layout/history-panel'
import { useCurrentDay } from '@/stores/current-day'

export function AppShell(): JSX.Element {
  const { dayId } = useCurrentDay()

  return (
    <div className="flex h-screen w-screen flex-col bg-white select-none">
      {/*
       * Invisible drag strip — traffic lights are hidden, but we still need
       * a draggable region so the user can move the window. 12px is enough.
       */}
      <div
        className="h-3 w-full shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      {/* Body — canvas on the left, history panel on the right */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">
          {/* key={dayId} remounts DayBoard on day change, resetting scroll */}
          <DayBoard key={dayId} dayId={dayId} />
        </main>

        <HistoryPanel />
      </div>

      {/* Status / action bar pinned to the bottom */}
      <BottomBar />
    </div>
  )
}
