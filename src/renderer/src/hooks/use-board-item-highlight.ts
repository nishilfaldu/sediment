import type { RefObject } from 'react'
import { useEffect, useState } from 'react'
import { useCurrentDay } from '@/stores/current-day'
import { isRecentItem, useRecentItems } from '@/stores/recent-items'

export function useBoardItemHighlight(
  itemId: string,
  elementRef: RefObject<HTMLElement | null>
): { flash: boolean; isRecent: boolean } {
  const [flash, setFlash] = useState(false)
  const expiresAt = useRecentItems((s) => s.expiresAt)
  const isRecent = isRecentItem(expiresAt, itemId)

  const focusItemId = useCurrentDay((s) => s.focusItemId)
  const clearFocus = useCurrentDay((s) => s.clearFocus)

  useEffect(() => {
    if (focusItemId !== itemId) return
    elementRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setFlash(true)
    clearFocus()
  }, [focusItemId, itemId, clearFocus, elementRef])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(false), 1600)
    return () => clearTimeout(t)
  }, [flash])

  return { flash, isRecent }
}
