import type { JSX } from 'react'
import { useShareActions } from '@/hooks/use-share-actions'
import { useSelection } from '@/stores/selection'

/** Appears above the bottom bar when cards are multi-selected (⌘/Ctrl-click). */
export function SelectionBar(): JSX.Element | null {
  const ids = useSelection((s) => s.ids)
  const clear = useSelection((s) => s.clear)
  const share = useShareActions({ type: 'items', ids })

  if (ids.length === 0) return null

  return (
    <div className="flex h-9 shrink-0 items-center justify-between border-t border-ui bg-panel px-4 font-mono text-[11px] text-secondary">
      <span>
        {ids.length} selected
        <span className="ml-2 text-ghost">⌘-click to toggle</span>
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            void share.copyForFriend().then(clear)
          }}
          className="hover:text-primary"
        >
          Copy for a friend
        </button>
        <button type="button" onClick={clear} className="text-muted hover:text-iron">
          Clear
        </button>
      </div>
    </div>
  )
}
