import type { ClipboardCapturePayload } from '@shared/clipboard-capture'
import { itemTagLabel } from '@shared/labels'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useCurrentDay } from '@/stores/current-day'
import { useRecentItems } from '@/stores/recent-items'
import { useToast } from '@/stores/toast'
import { useWorkspaceTab } from '@/stores/workspace-tab'

function captureLabel(payload: ClipboardCapturePayload): string {
  return itemTagLabel({ type: 'link', sourceUrl: payload.sourceUrl })
}

function invalidateDay(qc: ReturnType<typeof useQueryClient>, dayId: string): void {
  qc.invalidateQueries({ queryKey: ['items', dayId] })
  qc.invalidateQueries({ queryKey: ['days'] })
}

export function useClipboardCapture(): void {
  const qc = useQueryClient()

  useEffect(() => {
    const unsubCapture = window.api.on.clipboardCaptured((payload) => {
      useCurrentDay.getState().setDayId(payload.dayId)
      useWorkspaceTab.getState().setTab(payload.dayId, 'links')
      useRecentItems.getState().markRecent(payload.id)
      invalidateDay(qc, payload.dayId)

      useToast.getState().show(`Saved ${captureLabel(payload)}`, {
        durationMs: 8000,
        action: {
          label: 'Undo',
          onClick: () => {
            void window.api.items.delete(payload.id).then(() => {
              void window.api.clipboard.suppress(payload.sourceUrl)
              invalidateDay(qc, payload.dayId)
            })
          }
        }
      })
    })

    const unsubDuplicate = window.api.on.clipboardDuplicate(() => {
      useToast.getState().show('Already saved today', { durationMs: 3000 })
    })

    return () => {
      unsubCapture()
      unsubDuplicate()
    }
  }, [qc])
}
