import { useEffect, useRef } from 'react'
import { TYPE_LABELS } from '@shared/labels'
import { useCreateItem } from '@/hooks/use-items'
import { todayId } from '@/lib/dates'
import { useCurrentDay } from '@/stores/current-day'
import { useToast } from '@/stores/toast'

export { TYPE_LABELS }

export function useClipboardHotkey(): void {
  const { mutate } = useCreateItem()
  const { setDayId } = useCurrentDay()
  const { show: showToast } = useToast()

  const mutateRef = useRef(mutate)
  const setDayIdRef = useRef(setDayId)
  const showToastRef = useRef(showToast)

  useEffect(() => {
    mutateRef.current = mutate
  }, [mutate])
  useEffect(() => {
    setDayIdRef.current = setDayId
  }, [setDayId])
  useEffect(() => {
    showToastRef.current = showToast
  }, [showToast])

  useEffect(() => {
    const unsub = window.api.on.shortcutTriggered((payload) => {
      const dayId = todayId()
      setDayIdRef.current(dayId)

      mutateRef.current(
        {
          dayId,
          type: payload.type,
          content: payload.dataUrl ?? payload.content,
          sourceUrl: payload.sourceUrl,
          platform: payload.platform
        },
        {
          onSuccess: () => {
            showToastRef.current(`Saved ${TYPE_LABELS[payload.type]}`)
          }
        }
      )
    })
    return unsub
  }, [])
}
