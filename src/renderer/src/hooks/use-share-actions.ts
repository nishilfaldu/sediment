import type { Item } from '@shared/types'
import {
  formatDayMarkdown,
  formatItemsForFriend,
  formatItemsMarkdown,
  formatMoodboardLetter
} from '@shared/share'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useCallback, useRef } from 'react'
import { useItemsByIds } from '@/hooks/use-items'
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

  const dayItems = useQuery(
    api.items.getByDay,
    target.type === 'day' ? { dayId: target.dayId } : 'skip'
  )
  const selectedItems = useItemsByIds(target.type === 'items' ? target.ids : undefined)

  const resolveItems = useCallback((): Item[] => {
    const current = targetRef.current
    if (current.type === 'day') return dayItems ?? []
    return selectedItems ?? []
  }, [dayItems, selectedItems])

  const copyForFriend = useCallback(async () => {
    const current = targetRef.current
    const items = resolveItems()
    if (current.type === 'day') {
      await window.api.export.copyText(formatMoodboardLetter(current.dayId, items))
      showToast('Copied for a friend')
      return
    }
    await window.api.export.copyText(formatItemsForFriend(items))
    showToast(current.ids.length === 1 ? 'Copied for a friend' : `Copied ${current.ids.length} items`)
  }, [resolveItems, showToast])

  const copyMarkdown = useCallback(async () => {
    const current = targetRef.current
    const items = resolveItems()
    if (current.type === 'day') {
      await window.api.export.copyText(formatDayMarkdown(current.dayId, items))
    } else {
      await window.api.export.copyText(formatItemsMarkdown(items))
    }
    showToast('Copied as Markdown')
  }, [resolveItems, showToast])

  const openInAi = useCallback(
    (provider: 'chatgpt' | 'claude') => {
      const current = targetRef.current
      const items = resolveItems()
      const prompt =
        current.type === 'day'
          ? formatDayMarkdown(current.dayId, items)
          : formatItemsMarkdown(items)
      void window.api.export.openAi(provider, prompt)
    },
    [resolveItems]
  )

  return { copyForFriend, copyMarkdown, openInAi }
}
