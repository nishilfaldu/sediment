import type { JSX } from 'react'
import { useRef, useState } from 'react'
import { formatDayMarkdown } from '@shared/share'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useDismiss } from '@/hooks/use-dismiss'
import { useShareActions } from '@/hooks/use-share-actions'
import { useToast } from '@/stores/toast'

export interface ExportMenuProps {
  dayId: string
}

// Bottom-bar share/export popover for the current day.
export function ExportMenu({ dayId }: ExportMenuProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const showToast = useToast((s) => s.show)
  const share = useShareActions({ type: 'day', dayId })
  const items = useQuery(api.items.getByDay, { dayId })

  useDismiss(ref, () => setOpen(false), open)

  async function saveFile(): Promise<void> {
    setOpen(false)
    const markdown = formatDayMarkdown(dayId, items ?? [])
    const result = await window.api.export.saveMarkdown(`sediment-${dayId}.md`, markdown)
    if (result.saved) showToast('Exported to Markdown')
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-secondary transition-colors hover:text-primary"
      >
        Share
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1.5 min-w-[200px] border border-ui bg-card py-1 font-sans text-secondary shadow-popover">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              void share.copyForFriend()
            }}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-panel"
          >
            Copy for a friend
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              void share.copyMarkdown()
            }}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-panel"
          >
            Copy as Markdown
          </button>
          <button
            type="button"
            onClick={() => void saveFile()}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-panel"
          >
            Save as file…
          </button>
          <div className="my-1 border-t border-ui" />
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              share.openInAi('chatgpt')
            }}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-panel"
          >
            Open in ChatGPT
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              share.openInAi('claude')
            }}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-panel"
          >
            Open in Claude
          </button>
        </div>
      )}
    </div>
  )
}
