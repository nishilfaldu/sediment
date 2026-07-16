import { ipcMain } from 'electron'
import { applyGlobalHotkey, getGlobalHotkey } from '../services/global-hotkey'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', () => ({
    globalHotkey: getGlobalHotkey()
  }))

  ipcMain.handle('settings:setGlobalHotkey', (_e, accelerator: string | null) => {
    const error = applyGlobalHotkey(accelerator)
    return {
      ok: error === null,
      globalHotkey: getGlobalHotkey(),
      error
    } satisfies {
      ok: boolean
      globalHotkey: string | null
      error: string | null
    }
  })
}
