import type { JSX } from 'react'
import { ChevronRightIcon } from '@/components/icons/chevron-right-icon'
import { ExportMenu } from '@/components/layout/export-menu'
import { useWorkspaceItems } from '@/hooks/use-workspace-items'
import { formatDayHeading, todayId } from '@/lib/dates'
import { useCurrentDay } from '@/stores/current-day'
import { useUI } from '@/stores/ui'
import { useWorkspaceTab } from '@/stores/workspace-tab'

function formatCount(count: number, singular: string, plural: string): string {
  if (count === 0) return `No ${plural}`
  return `${count} ${count === 1 ? singular : plural}`
}

export function BottomBar(): JSX.Element {
  const { dayId, goToToday } = useCurrentDay()
  const { toggleHistory, historyOpen } = useUI()
  const tab = useWorkspaceTab((s) => s.getTab(dayId))
  const { linkCount, noteCount } = useWorkspaceItems(dayId)

  const isToday = dayId === todayId()
  const statusLabel =
    tab === 'links'
      ? formatCount(linkCount, 'link', 'links')
      : formatCount(noteCount, 'note', 'notes')

  return (
    <div className="flex h-9 shrink-0 select-none items-center justify-between border-t border-ui bg-surface px-4 font-mono text-[11px] text-muted">
      <span className="text-secondary">{statusLabel}</span>

      {isToday ? (
        <span className="text-muted" aria-hidden="true">
          &nbsp;
        </span>
      ) : (
        <button type="button" onClick={goToToday} className="text-secondary hover:text-primary">
          {formatDayHeading(dayId)}
          <span className="ml-1 text-ghost">↩ today</span>
        </button>
      )}

      <div className="flex items-center gap-3">
        {(tab === 'links' ? linkCount : noteCount) > 0 && <ExportMenu dayId={dayId} />}
        {tab === 'links' && (
          <span className="hidden text-muted sm:inline">Copy a link to save</span>
        )}
        {!historyOpen && (
          <button
            type="button"
            onClick={toggleHistory}
            className="flex items-center gap-1 text-secondary hover:text-primary"
            aria-label="Open history"
          >
            History
            <ChevronRightIcon />
          </button>
        )}
      </div>
    </div>
  )
}
