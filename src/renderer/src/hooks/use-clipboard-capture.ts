import type { ClipboardCandidatePayload } from '@shared/clipboard-capture'
import { todayId } from '@shared/dates'
import { BRIEF_TOAST_MS, CAPTURE_TOAST_MS, linkCapturePreview } from '@shared/toast'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useEffect, useRef } from 'react'
import { useDeleteItem } from '@/hooks/use-items'
import { useCurrentDay } from '@/stores/current-day'
import { useRecentItems } from '@/stores/recent-items'
import { useToast } from '@/stores/toast'
import { useWorkspaceTab } from '@/stores/workspace-tab'

function captureToastMessage(sourceUrl: string): string {
  const preview = linkCapturePreview(sourceUrl)
  return `Saved ${preview.tagLabel} · ${preview.detail}`
}

export function useClipboardCapture(): void {
  const captureLink = useMutation(api.items.captureLink)
  const deleteItem = useDeleteItem()
  const inFlight = useRef(new Set<string>())

  useEffect(() => {
    const undoCapture = (id: string, sourceUrl: string) => {
      void deleteItem(id).then(() => {
        void window.api.clipboard.suppress(sourceUrl)
      })
    }

    const unsubCandidate = window.api.on.clipboardCandidate((payload: ClipboardCandidatePayload) => {
      const dayId = payload.dayId || todayId()
      const key = `${dayId}:${payload.sourceUrl}`
      if (inFlight.current.has(key)) return
      inFlight.current.add(key)

      void (async () => {
        try {
          const result = await captureLink({
            dayId,
            sourceUrl: payload.sourceUrl
          })

          if (result.status === 'duplicate') {
            if (payload.showInAppToast) {
              const preview = linkCapturePreview(payload.sourceUrl)
              useToast.getState().show(`Already saved · ${preview.tagLabel}`, {
                durationMs: BRIEF_TOAST_MS
              })
            } else {
              await window.api.captureToast.showDuplicateOverlay(payload.sourceUrl)
            }
            return
          }

          const item = result.item
          useCurrentDay.getState().setDayId(item.dayId)
          useWorkspaceTab.getState().setTab(item.dayId, 'links')
          useRecentItems.getState().markRecent(item._id)

          if (payload.showInAppToast) {
            useToast.getState().show(captureToastMessage(payload.sourceUrl), {
              durationMs: CAPTURE_TOAST_MS,
              action: {
                label: 'Undo',
                onClick: () => undoCapture(item._id, payload.sourceUrl)
              }
            })
          } else {
            await window.api.captureToast.showOverlay({
              id: item._id,
              dayId: item.dayId,
              sourceUrl: payload.sourceUrl
            })
          }
        } finally {
          inFlight.current.delete(key)
        }
      })()
    })

    const unsubUndo = window.api.on.clipboardUndoRequest((payload) => {
      undoCapture(payload.id, payload.sourceUrl)
    })

    return () => {
      unsubCandidate()
      unsubUndo()
    }
  }, [captureLink, deleteItem])
}
