import type { JSX } from 'react'
import { useEffect, useRef } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { SearchModal } from '@/components/ui/search-modal'
import { Toast } from '@/components/ui/toast'
import { useClipboardCapture } from '@/hooks/use-clipboard-capture'
import { useSearchHotkey } from '@/hooks/use-search-hotkey'
import { useToast } from '@/stores/toast'

function App(): JSX.Element {
  useClipboardCapture()
  useSearchHotkey()
  useUpdateAvailableToast()

  return (
    <>
      <AppShell />
      <SearchModal />
      <Toast />
    </>
  )
}

/** One toast when a packaged startup check finds a newer GitHub release. */
function useUpdateAvailableToast(): void {
  const showToast = useToast((s) => s.show)
  const shownFor = useRef<string | null>(null)

  useEffect(() => {
    return window.api.on.updaterStatus((status) => {
      if (status.state !== 'available' || !status.availableVersion) return
      if (shownFor.current === status.availableVersion) return
      shownFor.current = status.availableVersion
      showToast(`Update v${status.availableVersion} available`, {
        durationMs: 8000,
        action: {
          label: 'Install',
          onClick: () => {
            void window.api.updater.install()
          }
        }
      })
    })
  }, [showToast])
}

export default App
