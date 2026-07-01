import type { JSX } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { PasteModal } from '@/components/ui/paste-modal'
import { SearchModal } from '@/components/ui/search-modal'
import { Toast } from '@/components/ui/toast'
import { useClipboardCapture } from '@/hooks/use-clipboard-capture'
import { useMetadataSync } from '@/hooks/use-metadata-sync'
import { useSearchHotkey } from '@/hooks/use-search-hotkey'

function App(): JSX.Element {
  useClipboardCapture()
  useMetadataSync()
  useSearchHotkey()

  return (
    <>
      <AppShell />
      <SearchModal />
      <PasteModal />
      <Toast />
    </>
  )
}

export default App
