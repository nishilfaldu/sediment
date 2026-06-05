import { useEffect } from 'react'
import { useSearch } from '@/stores/search'

// Cmd+K (macOS) / Ctrl+K toggles the full-text search modal.
export function useSearchHotkey(): void {
  const toggle = useSearch((s) => s.toggle)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggle])
}
