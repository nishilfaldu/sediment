import type { ClipboardCapturePayload } from '@shared/clipboard-capture'
import { BRIEF_TOAST_MS, CAPTURE_TOAST_MS, linkCapturePreview } from '@shared/toast'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useCurrentDay } from '@/stores/current-day'
import { useRecentItems } from '@/stores/recent-items'
import { useToast } from '@/stores/toast'
import { useWorkspaceTab } from '@/stores/workspace-tab'

function captureToastMessage(payload: ClipboardCapturePayload): string {
  const preview = linkCapturePreview(payload.sourceUrl)
  return `Saved ${preview.tagLabel} · ${preview.detail}`
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

      if (!payload.showInAppToast) return

      useToast.getState().show(captureToastMessage(payload), {
        durationMs: CAPTURE_TOAST_MS,
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

    const unsubDuplicate = window.api.on.clipboardDuplicate((payload) => {
      if (!payload.showInAppToast) return
      const preview = linkCapturePreview(payload.sourceUrl)
      useToast.getState().show(`Already saved · ${preview.tagLabel}`, {
        durationMs: BRIEF_TOAST_MS
      })
    })

    const unsubUndone = window.api.on.clipboardUndone((payload) => {
      invalidateDay(qc, payload.dayId)
    })

    return () => {
      unsubCapture()
      unsubDuplicate()
      unsubUndone()
    }
  }, [qc])
}
