import type { JSX } from 'react'
import { useEffect, useRef } from 'react'
import { DayListItem } from '@/components/calendar/day-list-item'
import { useDayList } from '@/hooks/use-day-list'
import { useCurrentDay } from '@/stores/current-day'
import { useUI } from '@/stores/ui'

export function HistoryPanel(): JSX.Element {
  const { historyOpen, toggleHistory } = useUI()
  const { dayId, setDayId } = useCurrentDay()
  const { days, status, loadMore } = useDayList()
  const scrollRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = scrollRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && status === 'CanLoadMore') {
          loadMore()
        }
      },
      { root, rootMargin: '80px', threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [status, loadMore])

  return (
    <aside
      className={`flex h-full flex-col border-l border-ui bg-panel transition-all duration-200 overflow-hidden ${
        historyOpen ? 'w-52 min-w-[13rem]' : 'w-0 min-w-0'
      }`}
    >
      <div className="flex min-w-[13rem] flex-col h-full">
        <div className="app-drag flex shrink-0 items-center justify-between border-b border-ui px-4 pt-4 pb-2.5">
          <span className="font-mono text-[10px] font-medium tracking-[0.22em] text-muted uppercase">
            History
          </span>
          <button
            type="button"
            onClick={toggleHistory}
            className="app-no-drag p-0.5 text-ghost hover:text-secondary transition-colors"
            aria-label="Collapse history"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M5 2.5l3.5 4L5 10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Days read as strata: newest at the surface, dotted bed boundaries. */}
        <div ref={scrollRef} className="flex flex-col overflow-y-auto pb-4">
          {days.map((day) => (
            <DayListItem
              key={day.id}
              day={day}
              isActive={day.id === dayId}
              onClick={() => setDayId(day.id)}
            />
          ))}
          <div ref={sentinelRef} className="h-1 shrink-0" aria-hidden="true" />
          {status === 'LoadingMore' && (
            <p className="px-4 py-2 font-mono text-[10px] text-ghost">Loading…</p>
          )}
        </div>
      </div>
    </aside>
  )
}
