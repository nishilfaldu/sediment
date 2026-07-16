import { useCallback, useRef } from 'react'
import { useToast } from '@/stores/toast'

export type ShareTarget = { type: 'day'; dayId: string } | { type: 'items'; ids: string[] }

export interface ShareActions {
  copyForFriend: () => Promise<void>
  copyMarkdown: () => Promise<void>
  openInAi: (provider: 'chatgpt' | 'claude') => void
}

/** Shared copy/open handlers for day Share menu, card context menu, and selection bar. */
export function useShareActions(target: ShareTarget): ShareActions {
  const showToast = useToast((s) => s.show)
  const targetRef = useRef(target)
  targetRef.current = target

  const copyForFriend = useCallback(async () => {
    const current = targetRef.current
    if (current.type === 'day') {
      await window.api.export.copyForFriend(current.dayId)
      showToast('Copied for a friend')
      return
    }
    await window.api.export.copyItemsForFriend(current.ids)
    showToast(
      current.ids.length === 1 ? 'Copied for a friend' : `Copied ${current.ids.length} items`
    )
  }, [showToast])

  const copyMarkdown = useCallback(async () => {
    const current = targetRef.current
    if (current.type === 'day') {
      await window.api.export.copyMarkdown(current.dayId)
    } else {
      await window.api.export.copyItemsMarkdown(current.ids)
    }
    showToast('Copied as Markdown')
  }, [showToast])

  const openInAi = useCallback((provider: 'chatgpt' | 'claude') => {
    const current = targetRef.current
    if (current.type === 'day') {
      void window.api.export.openInAi(current.dayId, provider)
    } else {
      void window.api.export.openItemsInAi(current.ids, provider)
    }
  }, [])

  return { copyForFriend, copyMarkdown, openInAi }
}
