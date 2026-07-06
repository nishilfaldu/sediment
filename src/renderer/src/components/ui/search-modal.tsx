import { workspaceTabForItemType } from '@shared/item-groups'
import { TYPE_LABELS } from '@shared/labels'
import type { JSX } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearch } from '@/hooks/use-search'
import { formatDaySidebar } from '@/lib/dates'
import { useCurrentDay } from '@/stores/current-day'
import { useSearch as useSearchStore } from '@/stores/search'
import { useWorkspaceTab } from '@/stores/workspace-tab'
import type { SearchResult } from '@/types'

// Debounce the query so we don't hit IPC on every keystroke.
function useDebounced(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

// Group results by day, preserving rank order (first day seen = best match).
function groupByDay(results: SearchResult[]): [string, SearchResult[]][] {
  const map = new Map<string, SearchResult[]>()
  for (const r of results) {
    const arr = map.get(r.dayId)
    if (arr) arr.push(r)
    else map.set(r.dayId, [r])
  }
  return [...map.entries()]
}

// Best single line of text to show for a hit.
function primaryText(r: SearchResult): string {
  return r.title?.trim() || r.content?.trim() || r.sourceUrl || 'Untitled'
}

function secondaryText(r: SearchResult): string | null {
  const primary = primaryText(r)
  const candidates = [r.description, r.sourceUrl, r.content]
  for (const c of candidates) {
    const t = c?.trim()
    if (t && t !== primary) return t
  }
  return null
}

export function SearchModal(): JSX.Element | null {
  const open = useSearchStore((s) => s.open)
  const setOpen = useSearchStore((s) => s.setOpen)
  const goToItem = useCurrentDay((s) => s.goToItem)
  const setTab = useWorkspaceTab((s) => s.setTab)

  const [query, setQuery] = useState('')
  const debounced = useDebounced(query, 180)
  const { data: results = [] } = useSearch(debounced)
  const [selected, setSelected] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // Reset transient state whenever the modal is opened.
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
    }
  }, [open])

  const groups = useMemo(() => groupByDay(results), [results])
  // Flattened in the SAME order the rows render (day-grouped), so a keyboard
  // index maps to the highlighted row. results is in rank order and would
  // diverge from the rendered order once hits span multiple days.
  const ordered = useMemo(() => groups.flatMap(([, dayResults]) => dayResults), [groups])

  // Keep the selection in range as results change.
  useEffect(() => {
    setSelected((s) => Math.min(s, Math.max(0, ordered.length - 1)))
  }, [ordered.length])

  // Scroll the selected row into view as the user arrows through.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${selected}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  if (!open) return null

  function close(): void {
    setOpen(false)
  }

  function activate(r: SearchResult): void {
    setTab(r.dayId, workspaceTabForItemType(r.type))
    goToItem(r.dayId, r.id)
    close()
  }

  function onKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, ordered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const r = ordered[selected]
      if (r) activate(r)
    }
  }

  // Running index across groups so keyboard selection maps to the flat list.
  let flatIndex = -1

  return (
    // Backdrop — click anywhere outside the panel to dismiss
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center bg-primary/20 pt-[12vh]"
      onClick={close}
    >
      <div
        className="w-full max-w-xl overflow-hidden border border-primary/30 bg-card shadow-[6px_6px_0_rgba(38,42,34,0.18)]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search everything…"
          className="w-full border-b border-ui bg-card px-4 py-3 text-base text-primary outline-none placeholder:text-ghost"
        />

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto">
          {debounced.trim() && results.length === 0 ? (
            <div className="px-4 py-8 text-center font-mono text-xs text-ghost">No results</div>
          ) : (
            groups.map(([dayId, dayResults]) => (
              <div key={dayId}>
                <div className="sticky top-0 border-b border-dotted border-ui bg-panel px-4 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                  {formatDaySidebar(dayId)}
                </div>
                {dayResults.map((r) => {
                  flatIndex += 1
                  const index = flatIndex
                  const isSelected = index === selected
                  const secondary = secondaryText(r)
                  return (
                    <button
                      key={r.id}
                      type="button"
                      data-index={index}
                      onClick={() => activate(r)}
                      onMouseMove={() => setSelected(index)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${
                        isSelected ? 'bg-panel' : ''
                      }`}
                    >
                      <span className="shrink-0 border border-ui bg-card px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-moss">
                        {TYPE_LABELS[r.type] ?? r.type}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-primary">
                          {primaryText(r)}
                        </span>
                        {secondary && (
                          <span className="block truncate text-xs text-muted">{secondary}</span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
