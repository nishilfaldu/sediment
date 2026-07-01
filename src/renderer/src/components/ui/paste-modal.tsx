import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { detectUrl } from '@shared/detect-url'
import { LinkPreview } from '@/components/ui/link-preview'
import { useMetadataPreview } from '@/hooks/use-metadata-preview'
import { useCreateItem } from '@/hooks/use-items'
import { usePasteModal } from '@/stores/paste-modal'
import { useToast } from '@/stores/toast'
import { useWorkspaceTab } from '@/stores/workspace-tab'

function useDebounced(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export function PasteModal(): JSX.Element | null {
  const open = usePasteModal((s) => s.open)
  const url = usePasteModal((s) => s.url)
  const target = usePasteModal((s) => s.target)
  const setUrl = usePasteModal((s) => s.setUrl)
  const close = usePasteModal((s) => s.close)
  const setTab = useWorkspaceTab((s) => s.setTab)
  const { show: showToast } = useToast()

  const createItem = useCreateItem()
  const debouncedUrl = useDebounced(url.trim(), 300)
  const detected = useMemo(
    () => (debouncedUrl ? detectUrl(debouncedUrl) : null),
    [debouncedUrl]
  )
  const { data: metadata, isFetching, isError } = useMetadataPreview(
    detected?.sourceUrl ?? null
  )

  const saving = createItem.isPending
  const canSave = Boolean(detected && target && !saving)

  if (!open) return null

  function dismiss(): void {
    close()
  }

  function save(): void {
    if (!detected || !target) return

    createItem.mutate(
      {
        dayId: target.dayId,
        type: detected.type,
        sourceUrl: detected.sourceUrl,
        platform: detected.platform ?? null,
        content: null,
        title: metadata?.title ?? null,
        description: metadata?.description ?? null,
        thumbnail: metadata?.thumbnail ?? null,
        metadata: metadata?.metadata ?? null
      },
      {
        onSuccess: () => {
          setTab(target.dayId, 'links')
          showToast('Link saved')
          dismiss()
        }
      }
    )
  }

  function onKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault()
      dismiss()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSave) {
      e.preventDefault()
      save()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center bg-stone-900/20 pt-[10vh]"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-stone-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="border-b border-stone-100 px-4 py-3">
          <h2 className="text-sm font-medium text-stone-800">Add link</h2>
          <p className="mt-0.5 text-xs text-stone-400">
            Paste a URL to preview it before saving to your links.
          </p>
        </div>

        <div className="space-y-4 p-4">
          <input
            autoFocus
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-800 outline-none placeholder:text-stone-300 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          />

          {debouncedUrl && !detected && (
            <p className="text-sm text-amber-600">Enter a valid http or https URL.</p>
          )}

          {detected && (
            <LinkPreview
              url={detected.sourceUrl}
              type={detected.type}
              platform={detected.platform}
              metadata={metadata}
              loading={isFetching}
            />
          )}

          {detected && isError && (
            <p className="text-xs text-stone-400">
              Preview unavailable — you can still save the link.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-stone-100 px-4 py-3">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={save}
            className="rounded-lg bg-stone-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save link'}
          </button>
        </div>
      </div>
    </div>
  )
}
