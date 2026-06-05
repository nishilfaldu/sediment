import { useEffect, useRef } from 'react'
import { useCreateItem } from '@/hooks/use-items'
import { todayId } from '@/lib/dates'
import { useCurrentDay } from '@/stores/current-day'
import { useToast } from '@/stores/toast'
import type { ItemType } from '@/types'

export interface ShortcutPayload {
  type: ItemType
  content?: string
  sourceUrl?: string
  platform?: string
  dataUrl?: string
}

export const TYPE_LABELS: Record<ItemType, string> = {
  text: 'text',
  link: 'link',
  video: 'video',
  social: 'post',
  image: 'image'
}

export function useClipboardHotkey(): void {
  const { mutate } = useCreateItem()
  const { setDayId } = useCurrentDay()
  const { show: showToast } = useToast()

  // Refs keep the subscription stable — the effect runs once, but always
  // calls the latest versions of these functions without needing to re-subscribe
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
    const unsub = window.api.on.shortcutTriggered((raw: unknown) => {
      const payload = raw as ShortcutPayload
      const dayId = todayId()

      // Always switch to today when a capture arrives
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
            const label = TYPE_LABELS[payload.type] ?? payload.type
            showToastRef.current(`Captured ${label}`)
          }
        }
      )
    })

    // unsub removes the ipcRenderer listener
    return unsub
  }, []) // Empty: subscription is set up once; refs carry the latest values
}
