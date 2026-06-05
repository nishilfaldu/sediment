import type { JSX } from 'react'
import { useRef, useState } from 'react'
import { useDismiss } from '@/hooks/use-dismiss'
import { useToast } from '@/stores/toast'

export interface ExportMenuProps {
  dayId: string
}

// Bottom-bar "Export ▾" popover: copy/share the current day for AI or archive.
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
        className="hover:text-stone-600 transition-colors"
      >
        Export ▾
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1.5 min-w-[180px] rounded-lg border border-stone-200 bg-white py-1 text-stone-600 shadow-lg">
          <button
            type="button"
            onClick={copy}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-stone-50"
          >
            Copy as Markdown
          </button>
          <button
            type="button"
            onClick={saveFile}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-stone-50"
          >
            Save as file…
          </button>
          <div className="my-1 border-t border-stone-100" />
          <button
            type="button"
            onClick={() => openInAi('chatgpt')}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-stone-50"
          >
            Open in ChatGPT
          </button>
          <button
            type="button"
            onClick={() => openInAi('claude')}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-stone-50"
          >
            Open in Claude
          </button>
        </div>
      )}
    </div>
  )
}
