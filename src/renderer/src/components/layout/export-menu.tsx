import type { JSX } from 'react'
import { useRef, useState } from 'react'
import { useDismiss } from '@/hooks/use-dismiss'
import { useToast } from '@/stores/toast'

export interface ExportMenuProps {
  dayId: string
}

// Bottom-bar "Export day" popover: copy/share the current day for AI or archive.
export function ExportMenu({ dayId }: ExportMenuProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { show: showToast } = useToast()

  useDismiss(ref, () => setOpen(false), open)

  async function copy(): Promise<void> {
    setOpen(false)
    await window.api.export.copyMarkdown(dayId)
    showToast('Copied as Markdown')
  }

  async function saveFile(): Promise<void> {
    setOpen(false)
    const result = await window.api.export.day(dayId)
    if (result.saved) showToast('Exported to Markdown')
  }

  function openInAi(provider: 'chatgpt' | 'claude'): void {
    setOpen(false)
    window.api.export.openInAi(dayId, provider)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
      >
        Export day
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1.5 min-w-[180px] rounded-lg border border-stone-200 bg-white py-1 text-stone-600 shadow-lg dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
          <button
            type="button"
            onClick={copy}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-800"
          >
            Copy as Markdown
          </button>
          <button
            type="button"
            onClick={saveFile}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-800"
          >
            Save as file…
          </button>
          <div className="my-1 border-t border-stone-100 dark:border-stone-800" />
          <button
            type="button"
            onClick={() => openInAi('chatgpt')}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-800"
          >
            Open in ChatGPT
          </button>
          <button
            type="button"
            onClick={() => openInAi('claude')}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-800"
          >
            Open in Claude
          </button>
        </div>
      )}
    </div>
  )
}
