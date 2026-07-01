import type { ClipboardCapturePayload } from '@shared/clipboard-capture'
import { TYPE_LABELS } from '@shared/labels'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useCurrentDay } from '@/stores/current-day'
import { useRecentItems } from '@/stores/recent-items'
import { useToast } from '@/stores/toast'
import { useWorkspaceTab } from '@/stores/workspace-tab'

function captureLabel(payload: ClipboardCapturePayload): string {
  return TYPE_LABELS[payload.type] ?? 'link'
}

export function useClipboardCapture(): void {
  const qc = useQueryClient()
  const { setDayId } = useCurrentDay()
  const { show: showToast } = useToast()
  const setTab = useWorkspaceTab((s) => s.setTab)
  const markRecent = useRecentItems((s) => s.markRecent)

  const setDayIdRef = useRef(setDayId)
  const showToastRef = useRef(showToast)
  const setTabRef = useRef(setTab)
  const qcRef = useRef(qc)
  const markRecentRef = useRef(markRecent)

  useEffect(() => {
    setDayIdRef.current = setDayId
  }, [setDayId])
  useEffect(() => {
    showToastRef.current = showToast
  }, [showToast])
  useEffect(() => {
    setTabRef.current = setTab
  }, [setTab])
  useEffect(() => {
    qcRef.current = qc
  }, [qc])
  useEffect(() => {
    markRecentRef.current = markRecent
  }, [markRecent])

  useEffect(() => {
    const unsubCapture = window.api.on.clipboardCaptured((payload) => {
      setDayIdRef.current(payload.dayId)
      setTabRef.current(payload.dayId, 'links')
      markRecentRef.current(payload.id)
      qcRef.current.invalidateQueries({ queryKey: ['items', payload.dayId] })
      qcRef.current.invalidateQueries({ queryKey: ['days'] })

      showToastRef.current(`Saved ${captureLabel(payload)}`, {
        durationMs: 8000,
        action: {
          label: 'Undo',
          onClick: () => {
            void window.api.items.delete(payload.id).then(() => {
              void window.api.clipboard.suppress(payload.sourceUrl)
              qcRef.current.invalidateQueries({ queryKey: ['items', payload.dayId] })
              qcRef.current.invalidateQueries({ queryKey: ['days'] })
            })
          }
        }
      })
    })

    const unsubDuplicate = window.api.on.clipboardDuplicate(() => {
      showToastRef.current('Already saved today', { durationMs: 3000 })
    })

    return () => {
      unsubCapture()
      unsubDuplicate()
    }
  }, [])
}
