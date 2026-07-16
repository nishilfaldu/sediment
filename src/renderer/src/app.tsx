import type { JSX } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { SearchModal } from '@/components/ui/search-modal'
import { Toast } from '@/components/ui/toast'
import { useClipboardCapture } from '@/hooks/use-clipboard-capture'
import { useSearchHotkey } from '@/hooks/use-search-hotkey'

function App(): JSX.Element {
  useClipboardCapture()
  useSearchHotkey()

  return (
    <>
      <AppShell />
      <SearchModal />
      <Toast />
    </>
  )
}

export default App
