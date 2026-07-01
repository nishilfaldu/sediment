import type { JSX } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { PasteModal } from '@/components/ui/paste-modal'
import { SearchModal } from '@/components/ui/search-modal'
import { Toast } from '@/components/ui/toast'
import { useClipboardHotkey } from '@/hooks/use-clipboard-hotkey'
import { useMetadataSync } from '@/hooks/use-metadata-sync'
import { useSearchHotkey } from '@/hooks/use-search-hotkey'

function App(): JSX.Element {
  // Register the Cmd+Shift+S clipboard capture listener for the app's lifetime
  useClipboardHotkey()
  // Invalidate item queries when OG metadata arrives from the main process
  useMetadataSync()
  // Cmd+K opens full-text search
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
